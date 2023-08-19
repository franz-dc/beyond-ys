import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  doc,
  documentId,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { useSnackbar } from 'notistack';
import {
  AutocompleteElement,
  FormContainer,
  RadioButtonGroup,
  TextFieldElement,
  useFieldArray,
  useForm,
} from 'react-hook-form-mui';
import slugify from 'slugify';
import { useDebouncedCallback } from 'use-debounce';
import { z } from 'zod';

import {
  DatePickerElement,
  GenericHeader,
  MainLayout,
  SwitchElement,
} from '~/components';
import {
  auth,
  cacheCollection,
  db,
  gamesCollection,
  musicAlbumsCollection,
  musicCollection,
  storage,
} from '~/configs';
import {
  MusicAlbumCacheSchema,
  MusicCacheSchema,
  MusicSchema,
  imageSchema,
  musicAlbumSchema,
} from '~/schemas';
import { formatISO, revalidatePaths } from '~/utils';

const AddMusicAlbum = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [musicAlbumsCache, setMusicAlbumsCache] = useState<
    Record<string, MusicAlbumCacheSchema>
  >({});
  const [isLoadingMusicAlbumsCache, setIsLoadingMusicAlbumsCache] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(cacheCollection, 'musicAlbums'),
      (docSnap) => {
        setMusicAlbumsCache(docSnap.data() || {});
        setIsLoadingMusicAlbumsCache(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const [musicCache, setMusicCache] = useState<
    Record<string, MusicCacheSchema>
  >({});
  const [isLoadingMusicCache, setIsLoadingMusicCache] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(cacheCollection, 'music'), (docSnap) => {
      setMusicCache(docSnap.data() || {});
      setIsLoadingMusicCache(false);
    });

    return () => unsubscribe();
  }, []);

  const schema = musicAlbumSchema
    .omit({
      hasAlbumArt: true,
      cachedMusic: true,
      updatedAt: true,
      // doing this to fulfill useFieldArray's requirement
      musicIds: true,
    })
    .extend({
      customSlug: z.boolean(),
      id: z
        .string()
        .min(1)
        .refine((id) => !musicAlbumsCache[id], {
          message: 'Slug is already taken.',
        }),
      musicIds: z.object({ value: z.string().min(1) }).array(),
      releaseDatePrecision: z.string().min(1),
      albumArt: imageSchema
        // check if less than 500x500
        .refine(
          async (value) => {
            if (!value) return true;
            return await new Promise<boolean>((resolve) => {
              const reader = new FileReader();
              reader.readAsDataURL(value);
              reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                  const { width, height } = img;
                  resolve(width <= 500 && height <= 500);
                };
              };
            });
          },
          { message: 'Album art must not be bigger than 500x500 pixels.' }
        ),
    })
    .refine(
      (data) => {
        const { releaseDate, releaseDatePrecision } = data;

        if (
          ['day', 'month', 'year'].includes(releaseDatePrecision) &&
          !releaseDate
        ) {
          return false;
        }

        return true;
      },
      {
        message: 'Release date is required if precision is not unknown.',
        path: ['releaseDate'],
      }
    );

  type Schema = z.infer<typeof schema> & {
    id: string | null;
  };

  const formContext = useForm<Schema>({
    defaultValues: {
      id: '',
      name: '',
      customSlug: false,
      releaseDate: null,
      releaseDatePrecision: '',
      albumArt: null,
      musicIds: [],
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    register,
    watch,
    trigger,
    getValues,
    setValue,
    reset,
    formState: { isSubmitting, errors },
    handleSubmit,
  } = formContext;

  const {
    fields: musicIds,
    append: appendMusic,
    remove: removeMusic,
    swap: swapMusic,
  } = useFieldArray({
    control,
    name: 'musicIds',
  });

  const handleSave = async ({
    id,
    name,
    musicIds,
    releaseDate,
    releaseDatePrecision,
    albumArt,
  }: Schema) => {
    releaseDate = releaseDate || '';

    // check if id is already taken (using the musicAlbums cache)
    // failsafe in case the user somehow bypasses the form validation
    if (musicAlbumsCache[id]) {
      enqueueSnackbar(`Slug '${id}' is already taken.`, {
        variant: 'error',
      });
      return;
    }
    if (!auth.currentUser) {
      enqueueSnackbar('You must be logged in to perform this action.', {
        variant: 'error',
      });
    }

    try {
      // get auth token for revalidation
      const tokenRes = await auth.currentUser?.getIdTokenResult(true);

      if (tokenRes?.claims?.role !== 'admin') {
        enqueueSnackbar('Insufficient permissions.', { variant: 'error' });
        return;
      }

      // upload image first to update hasAlbumArt
      let hasAlbumArt = false;
      if (albumArt) {
        await uploadBytes(ref(storage, `album-arts/${id}`), albumArt);
        hasAlbumArt = true;
      }

      const albumInfoDocRef = doc(musicAlbumsCollection, id);

      // doing this to reduce the number of writes per staffInfo doc
      const staffInfoChanges: Record<
        string, // staffId
        Record<string, unknown> // doc changes
      > = {};

      // doing this to reduce the number of writes per music doc
      const changedGames: Record<string, Record<string, unknown>> = {};

      const batch = writeBatch(db);

      // populate cachedMusic from musicIds
      const formattedMusicIds = musicIds.map(({ value }) => value);

      const cachedMusic: Record<string, MusicSchema> = {};

      if (formattedMusicIds.length > 0) {
        // split the addedSoundtrackIds into chunks of 30
        // due to 'in' query limit
        const formattedMusicIdsChunks = formattedMusicIds.reduce(
          (acc, curr) => {
            const last = acc[acc.length - 1];
            if (last.length < 30) {
              last.push(curr);
            } else {
              acc.push([curr]);
            }
            return acc;
          },
          [[]] as string[][]
        );

        const newMusicQuerySnaps = await Promise.all(
          formattedMusicIdsChunks.map((chunk) =>
            getDocs(query(musicCollection, where(documentId(), 'in', chunk)))
          )
        );

        newMusicQuerySnaps.forEach((snap) => {
          snap.forEach((doc) => {
            if (!doc.exists()) return;

            const musicData = doc.data();

            cachedMusic[doc.id] = {
              ...musicData,
              albumId: id,
            };

            // update staffInfo and game music cache
            [
              ...new Set([
                ...musicData.composerIds,
                ...musicData.arrangerIds,
                ...musicData.otherArtists.map(({ staffId }) => staffId),
              ]),
            ].forEach((staffId) => {
              if (!staffInfoChanges[staffId]) {
                staffInfoChanges[staffId] = {};
              }

              staffInfoChanges[staffId] = {
                ...staffInfoChanges[staffId],
                // We don't care about updating the cache updatedAt (useless).
                // staffInfo doc's updatedAt will be updated below to avoid
                // redundancy.
                [`cachedMusic.${doc.id}.albumId`]: id,
              };

              musicData.dependentGameIds.forEach((gameId) => {
                if (!changedGames[gameId]) {
                  changedGames[gameId] = {};
                }

                changedGames[gameId] = {
                  ...changedGames[gameId],
                  [`cachedSoundtracks.${doc.id}.albumId`]: '',
                };
              });
            });
          });
        });

        // update the music docs
        formattedMusicIds.forEach((musicId) => {
          batch.update(doc(musicCollection, musicId), {
            albumId: id,
            updatedAt: serverTimestamp(),
          });
        });

        // update the music cache
        batch.update(doc(cacheCollection, 'music'), {
          ...Object.fromEntries(
            formattedMusicIds.map((musicId) => [`${musicId}.albumId`, id])
          ),
        });
      }

      let formattedReleaseDate = '';

      if (
        releaseDate &&
        ['day', 'month', 'year'].includes(releaseDatePrecision)
      ) {
        formattedReleaseDate = formatISO(
          new Date(releaseDate),
          releaseDatePrecision as 'day' | 'month' | 'year'
        );
      }

      const newData = {
        name,
        musicIds: formattedMusicIds,
        cachedMusic,
        releaseDate: formattedReleaseDate,
        hasAlbumArt,
        updatedAt: serverTimestamp(),
      };

      // create the music album doc and fill the rest with blank data
      batch.set(albumInfoDocRef, newData);

      // update the musicAlbums cache
      batch.update(doc(cacheCollection, 'musicAlbums'), {
        [id]: {
          name,
          releaseDate: formattedReleaseDate,
          hasAlbumArt,
        },
      });

      // update game docs
      Object.entries(changedGames).forEach(([gameId, changes]) => {
        batch.update(doc(gamesCollection, gameId), {
          ...changes,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      await revalidatePaths(
        [
          `/music/${id}`,
          '/music',
          ...Object.keys(staffInfoChanges).map(
            (staffId) => `/staff/${staffId}`
          ),
          ...Object.keys(changedGames).map((gameId) => `/games/${gameId}`),
        ],
        tokenRes.token
      );

      // don't wait for onSnapshot to update the musicAlbumCache state
      setMusicAlbumsCache((prev) => ({
        ...prev,
        [id]: {
          name,
          releaseDate: formattedReleaseDate,
          hasAlbumArt,
        },
      }));

      reset();

      enqueueSnackbar('Music album added successfully.', {
        variant: 'success',
      });
    } catch (err) {
      enqueueSnackbar('Failed to add music album.', { variant: 'error' });
      console.error(err);
    }
  };

  const customSlug = watch('customSlug');
  const albumArt = watch('albumArt');

  const debounceName = useDebouncedCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue('name', e.target.value);
      if (customSlug) return;
      const name = e.target.value;
      const id = slugify(name, {
        lower: true,
        remove: /[*+~.,()'"!:@/]/g,
      });

      setValue('id', id, { shouldValidate: true });
    },
    500
  );

  return (
    <MainLayout title='Add Music Album'>
      <GenericHeader title='Add Music Album' gutterBottom />
      <FormContainer
        formContext={formContext}
        handleSubmit={handleSubmit(handleSave, (err) => console.error(err))}
      >
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Slug</Typography>
          <Typography color='text.secondary'>
            Make sure the slug is correct. This cannot be changed later.
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 1 }}>
            By default, the slug will be automatically generated from the name.
          </Typography>
          <SwitchElement
            name='customSlug'
            label='Use custom slug'
            onChange={(e) => {
              if (e.target.checked) return;
              setValue(
                'id',
                slugify(getValues('name'), {
                  lower: true,
                  remove: /[*+~.,()'"!:@/]/g,
                })
              );
            }}
          />
          <TextFieldElement
            name='id'
            label='Slug'
            required
            fullWidth
            margin='normal'
            disabled={!customSlug}
            helperText='Slug can only contain lowercase letters, numbers, and dashes.'
          />
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>General Info</Typography>
          <TextField
            label='Name'
            required
            fullWidth
            margin='normal'
            {...register('name')}
            onChange={debounceName}
          />
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Release Date</Typography>
          <DatePickerElement
            name='releaseDate'
            label='Release Date'
            inputProps={{
              fullWidth: true,
              margin: 'normal',
            }}
            slotProps={{
              actionBar: {
                actions: ['clear'],
              },
            }}
            helperText='For dates with less precision, fill in the rest with random values.'
          />
          <RadioButtonGroup
            name='releaseDatePrecision'
            label='Precision'
            options={[
              { label: 'Year, month, and day', id: 'day' },
              { label: 'Year and month only', id: 'month' },
              { label: 'Year only', id: 'year' },
              { label: 'Unknown date', id: 'unknown' },
            ]}
          />
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Album Art</Typography>
          <Typography color='text.secondary'>
            Accepted file type: .webp
          </Typography>
          <Typography color='text.secondary'>Max size: 5MB.</Typography>
          <Typography color='text.secondary'>
            Max dimensions: 500x500.
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 2 }}>
            Note that album arts are cropped to 1:1 aspect ratio.
          </Typography>
          <Box>
            <Box>
              <Box display='inline-block'>
                <input
                  style={{ display: 'none' }}
                  id='albumArt'
                  type='file'
                  accept='image/webp'
                  {...register('albumArt', {
                    onChange: (e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files?.[0].type === 'image/webp') {
                        setValue('albumArt', e.target.files[0]);
                      } else {
                        setValue('albumArt', null);
                        enqueueSnackbar(
                          'Invalid file type. Only .webp is accepted.',
                          { variant: 'error' }
                        );
                      }
                      trigger('albumArt');
                    },
                  })}
                />
                <label htmlFor='albumArt'>
                  <Button
                    variant='contained'
                    color={errors.albumArt ? 'error' : 'primary'}
                    component='span'
                  >
                    {!!albumArt ? 'Replace Album Art' : 'Upload Album Art'}
                  </Button>
                </label>
              </Box>
              {albumArt && (
                <Button
                  variant='outlined'
                  onClick={() =>
                    setValue('albumArt', null, {
                      shouldValidate: true,
                    })
                  }
                  sx={{ ml: 2 }}
                >
                  Remove Selected Album Art
                </Button>
              )}
            </Box>
            {/* display selected image */}
            {albumArt && (
              <Box sx={{ mt: 2 }}>
                {errors.albumArt && (
                  <Typography color='error.main' sx={{ mb: 2 }}>
                    {errors.albumArt.message}
                  </Typography>
                )}
                <Box
                  className='default-bg'
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Typography color='text.secondary' sx={{ mb: 1 }}>
                    Selected album art (cropped):
                  </Typography>
                  <Box
                    component='img'
                    src={URL.createObjectURL(albumArt)}
                    alt='selected album art'
                    sx={{
                      width: '100%',
                      maxWidth: 300,
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Music</Typography>
          <Typography color='text.secondary'>
            Music from a different album will be changed to this album.
          </Typography>
          {musicIds.map((musicId, idx) => (
            <Stack direction='row' spacing={2} key={musicId.id}>
              <AutocompleteElement
                name={`musicIds.${idx}.value`}
                label={`Track ${idx + 1}`}
                options={Object.entries(musicCache)
                  .map(([id, { title, albumId }]) => {
                    const foundAlbum = musicAlbumsCache[albumId];

                    const albumName =
                      albumId === ''
                        ? 'No album'
                        : foundAlbum.name || 'Unknown album';

                    return {
                      id,
                      label: `${title} (${albumName})`,
                    };
                  })
                  .filter(
                    ({ id }) =>
                      // remove music that are already added
                      !musicIds.some((m) => m.value === id) ||
                      musicId.value === id
                  )}
                autocompleteProps={{ fullWidth: true }}
                textFieldProps={{ margin: 'normal' }}
                loading={isLoadingMusicCache}
                matchId
                required
              />
              <Button
                variant='outlined'
                onClick={() => removeMusic(idx)}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Remove
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === 0) return;
                  swapMusic(idx, idx - 1);
                }}
                disabled={idx === 0}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Up
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === musicIds.length - 1) return;
                  swapMusic(idx, idx + 1);
                }}
                disabled={idx === musicIds.length - 1}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Down
              </Button>
            </Stack>
          ))}
          <Button
            variant='outlined'
            onClick={() => appendMusic({ value: '' })}
            disabled={
              isLoadingMusicCache ||
              musicIds.length >= Object.keys(musicCache).length
            }
            fullWidth
            sx={{ mt: 1 }}
          >
            Add Music
          </Button>
        </Paper>
        <LoadingButton
          type='submit'
          variant='contained'
          disabled={isLoadingMusicAlbumsCache}
          loading={isSubmitting}
          fullWidth
        >
          Submit
        </LoadingButton>
      </FormContainer>
    </MainLayout>
  );
};

export default AddMusicAlbum;
