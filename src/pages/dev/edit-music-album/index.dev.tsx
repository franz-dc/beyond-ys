import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  doc,
  documentId,
  getDoc,
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
import { z } from 'zod';

import { DatePickerElement, GenericHeader, MainLayout } from '~/components';
import {
  auth,
  cacheCollection,
  db,
  gamesCollection,
  musicAlbumsCollection,
  musicCollection,
  staffInfosCollection,
  storage,
} from '~/configs';
import { CLOUD_STORAGE_URL } from '~/constants';
import {
  MusicAlbumCacheSchema,
  MusicAlbumSchema,
  MusicCacheSchema,
  imageSchema,
  musicAlbumSchema,
} from '~/schemas';
import { formatISO, revalidatePaths } from '~/utils';

const EditMusicAlbum = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [musicAlbumsCache, setMusicAlbumsCache] = useState<
    Record<string, MusicAlbumCacheSchema>
  >({});
  const [isLoadingMusicAlbumsCache, setIsLoadingMusicAlbumsCache] =
    useState(true);

  // doing this in case someone else added an album while the user is
  // filling this form. this will update the validation in real time
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
      cachedMusic: true,
      updatedAt: true,
      musicIds: true,
    })
    .extend({
      id: z.string().nullable(),
      // doing this to fulfill useFieldArray's requirement
      // useFieldArray requires the array to be an array of objects
      musicIds: z
        .object({
          value: z.string(),
        })
        .array(),
      releaseDatePrecision: z.enum(['day', 'month', 'year', 'unknown']),
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

  const [lastMusicAlbumId, setLastMusicAlbumId] = useState<string | null>(null);
  const [isLoadingMusicAlbum, setIsLoadingMusicAlbum] = useState(false);
  const [currentMusicAlbumData, setCurrentMusicAlbumData] =
    useState<MusicAlbumSchema | null>(null);

  const formContext = useForm<Schema>({
    defaultValues: {
      id: '',
      name: '',
      musicIds: [],
      releaseDate: null,
      releaseDatePrecision: 'unknown',
      albumArt: null,
      hasAlbumArt: false,
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    register,
    trigger,
    reset,
    setValue,
    watch,
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

  const currentId = watch('id');
  const albumArt = watch('albumArt');
  const hasAlbumArt = watch('hasAlbumArt');

  const changeMusicAlbum = async (id: string) => {
    try {
      setIsLoadingMusicAlbum(true);
      const musicAlbumSnap = await getDoc(doc(musicAlbumsCollection, id));
      const musicAlbum = musicAlbumSnap.data();

      if (musicAlbum) {
        const { cachedMusic, updatedAt, musicIds, releaseDate, ...rest } =
          musicAlbum;

        const releaseDatePrecision = (() => {
          // releaseDate is string here
          const releaseDateStr = releaseDate as string;

          switch (releaseDateStr.length) {
            case 4: // 2000
              return 'year';
            case 7: // 2000-01
              return 'month';
            case 10: // 2000-01-01
              return 'day';
            default:
              return 'unknown';
          }
        })();

        setCurrentMusicAlbumData(musicAlbum);
        reset({
          ...rest,
          id,
          musicIds: musicIds.map((value) => ({ value })),
          releaseDate: releaseDate ? new Date(releaseDate) : null,
          releaseDatePrecision,
          albumArt: null,
        });
        setLastMusicAlbumId(id);
      } else {
        setCurrentMusicAlbumData({
          name: '',
          musicIds: [],
          cachedMusic: {},
          releaseDate: '',
          hasAlbumArt: false,
          updatedAt: null,
        });
        reset({
          id,
          name: '',
          musicIds: [],
          releaseDate: null,
          releaseDatePrecision: 'unknown',
          hasAlbumArt: false,
        });
        setLastMusicAlbumId(id);
      }
    } catch (err) {
      enqueueSnackbar('Failed to fetch music album data.', {
        variant: 'error',
      });
      setValue('id', lastMusicAlbumId);
      console.error(err);
    } finally {
      setIsLoadingMusicAlbum(false);
    }
  };

  const handleSave = async ({
    id,
    releaseDate,
    releaseDatePrecision,
    hasAlbumArt,
    albumArt,
    ...values
  }: Schema) => {
    if (!id) return;
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
      let newHasAlbumArt = hasAlbumArt;
      if (albumArt) {
        await uploadBytes(ref(storage, `album-arts/${id}`), albumArt);
        newHasAlbumArt = true;
      }

      const albumId = id;

      const cachedMusic = {
        ...currentMusicAlbumData?.cachedMusic,
      };

      // doing this to reduce the number of writes per staffInfo doc
      const staffInfoChanges: Record<
        string, // staffId
        Record<string, unknown> // doc changes
      > = {};

      // doing this to reduce the number of writes per music doc
      const changedGames: Record<string, Record<string, unknown>> = {};

      const musicAlbumDocRef = doc(musicAlbumsCollection, id);

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

      const batch = writeBatch(db);

      const isCacheDataChanged =
        currentMusicAlbumData?.name !== values.name ||
        currentMusicAlbumData?.releaseDate !== formattedReleaseDate ||
        currentMusicAlbumData?.hasAlbumArt !== newHasAlbumArt;

      // update musicAlbums cache if name is changed
      if (isCacheDataChanged) {
        const musicAlbumCacheDocRef = doc(cacheCollection, 'musicAlbums');

        batch.update(musicAlbumCacheDocRef, {
          [id]: {
            name: values.name,
            releaseDate: formattedReleaseDate,
            hasAlbumArt: newHasAlbumArt,
          },
        });
      }

      // update music cache if musicIds is changed
      const musicCacheDocRef = doc(cacheCollection, 'music');

      const changedMusicCacheItems: Record<string, MusicCacheSchema> = {};

      // check if a music is removed from the musicIds array
      // if it is, make the albumId from the music doc and the albumId from
      // the music cache to ''
      const musicIds = values.musicIds.map(({ value }) => value);

      const removedMusicIds = currentMusicAlbumData?.musicIds.filter(
        (id) => !musicIds.includes(id)
      );

      if (removedMusicIds?.length) {
        removedMusicIds.forEach((id) => {
          changedMusicCacheItems[id] = {
            title: musicCache[id]?.title,
            albumId: '',
          };

          // remove from music album doc's cachedMusic
          delete cachedMusic[id];

          // update music doc's albumId
          batch.update(doc(musicCollection, id), {
            albumId: '',
            updatedAt: serverTimestamp(),
          });
        });

        // split the removedSoundtrackIds into chunks of 30
        // due to 'in' query limit
        const removedMusicIdsChunks = removedMusicIds.reduce<string[][]>(
          (acc, curr) => {
            const last = acc[acc.length - 1];
            if (last.length < 30) {
              last.push(curr);
            } else {
              acc.push([curr]);
            }
            return acc;
          },
          [[]]
        );

        // update staffInfo doc's cachedMusic
        const removedMusicQuerySnaps = await Promise.all(
          removedMusicIdsChunks.map((chunk) =>
            getDocs(query(musicCollection, where(documentId(), 'in', chunk)))
          )
        );

        removedMusicQuerySnaps.forEach((snap) => {
          snap.forEach((doc) => {
            if (!doc.exists()) return;

            const musicData = doc.data();

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
                [`cachedMusic.${doc.id}.albumId`]: '',
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
      }

      // check if a music is added to the musicIds array
      // if it is, make the albumId from the music doc and the albumId from
      // the music cache to the current music album id
      const addedMusicIds = musicIds.filter(
        (id) => !currentMusicAlbumData?.musicIds.includes(id)
      );

      if (addedMusicIds.length) {
        addedMusicIds.forEach((id) => {
          changedMusicCacheItems[id] = {
            title: musicCache[id]?.title,
            albumId,
          };

          // update music doc's albumId
          batch.update(doc(musicCollection, id), {
            albumId,
            updatedAt: serverTimestamp(),
          });
        });

        // split the addedSoundtrackIds into chunks of 30
        // due to 'in' query limit
        const addedMusicIdsChunks = addedMusicIds.reduce<string[][]>(
          (acc, curr) => {
            const last = acc[acc.length - 1];
            if (last.length < 30) {
              last.push(curr);
            } else {
              acc.push([curr]);
            }
            return acc;
          },
          [[]]
        );

        // add new music to music album doc's cachedMusic
        const newMusicQuerySnaps = await Promise.all(
          addedMusicIdsChunks.map((chunk) =>
            getDocs(query(musicCollection, where(documentId(), 'in', chunk)))
          )
        );

        newMusicQuerySnaps.forEach((snap) => {
          snap.forEach((doc) => {
            if (!doc.exists()) return;

            const musicData = doc.data();
            cachedMusic[doc.id] = {
              ...musicData,
              albumId,
            };

            // update staffInfo doc's cachedMusic
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
                [`cachedMusic.${doc.id}.albumId`]: albumId,
              };

              musicData.dependentGameIds.forEach((gameId) => {
                if (!changedGames[gameId]) {
                  changedGames[gameId] = {};
                }

                changedGames[gameId] = {
                  ...changedGames[gameId],
                  [`cachedSoundtracks.${doc.id}.albumId`]: albumId,
                };
              });
            });
          });
        });
      }

      // update musicAlbum doc
      batch.update(musicAlbumDocRef, {
        ...values,
        musicIds: values.musicIds.map(({ value }) => value),
        updatedAt: serverTimestamp(),
        releaseDate: formattedReleaseDate,
        hasAlbumArt: newHasAlbumArt,
        // @ts-ignore
        cachedMusic,
      });

      // update music cache if there are changes
      if (Object.keys(changedMusicCacheItems).length) {
        batch.update(musicCacheDocRef, changedMusicCacheItems);
      }

      // update staffInfo docs
      Object.entries(staffInfoChanges).forEach(([staffId, changes]) => {
        batch.update(doc(staffInfosCollection, staffId), {
          ...changes,
          updatedAt: serverTimestamp(),
        });
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
          ...(isCacheDataChanged || !!albumArt ? ['/music'] : []),
          ...Object.keys(staffInfoChanges).map(
            (staffId) => `/staff/${staffId}`
          ),
          ...Object.keys(changedGames).map((gameId) => `/games/${gameId}`),
        ],
        tokenRes.token
      );

      setCurrentMusicAlbumData((prev) => ({
        ...prev!,
        ...values,
        musicIds: values.musicIds.map(({ value }) => value),
      }));

      setMusicAlbumsCache((prev) => ({
        ...prev,
        [id]: {
          name: values.name,
          releaseDate: formattedReleaseDate,
          hasAlbumArt: newHasAlbumArt,
        },
      }));

      // reset images after submit
      setValue('albumArt', null);
      setValue('hasAlbumArt', newHasAlbumArt);

      enqueueSnackbar('Music album updated successfully.', {
        variant: 'success',
      });
    } catch (err) {
      enqueueSnackbar('Failed to update music album.', {
        variant: 'error',
      });
      console.error(err);
    }
  };

  return (
    <MainLayout title='Edit Music Album'>
      <GenericHeader title='Edit Music Album' gutterBottom />
      <FormContainer
        formContext={formContext}
        handleSubmit={handleSubmit(handleSave, (err) => console.error(err))}
      >
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Selection</Typography>
          <AutocompleteElement
            name='id'
            label='Music Album'
            options={Object.entries(musicAlbumsCache).map(
              ([id, { name: label }]) => ({
                id,
                label,
              })
            )}
            loading={isLoadingMusicAlbumsCache}
            autocompleteProps={{
              onChange: (_, v) => changeMusicAlbum(v.id),
              fullWidth: true,
              disableClearable: true,
            }}
            textFieldProps={{
              margin: 'normal',
            }}
            required
            matchId
          />
        </Paper>
        {isLoadingMusicAlbum && <CircularProgress />}
        {!!currentId && !isLoadingMusicAlbum && (
          <>
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Typography variant='h2'>General Info</Typography>
              <TextFieldElement
                name='name'
                label='Name'
                required
                fullWidth
                margin='normal'
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
              {/* display album art if hasAlbumArt is true */}
              {hasAlbumArt ? (
                <Box
                  className='default-bg'
                  sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Typography color='text.secondary' sx={{ mb: 1 }}>
                    Current album art (cropped):
                  </Typography>
                  <Box
                    component='img'
                    src={`${CLOUD_STORAGE_URL}/album-arts/${currentId}`}
                    alt='current album art'
                    sx={{
                      width: '100%',
                      maxWidth: 300,
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ) : (
                <Typography color='text.secondary' sx={{ mb: 2 }}>
                  No album art uploaded yet.
                </Typography>
              )}
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
                        {hasAlbumArt || !!albumArt
                          ? 'Replace Album Art'
                          : 'Upload Album Art'}
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
            {!!albumArt && (
              <Alert severity='warning' sx={{ mb: 2 }}>
                Please be advised that replaced images will take up at most 60
                minutes to reflect on the page. This is due to Google Cloud
                Storage object caching.
              </Alert>
            )}
            <LoadingButton
              type='submit'
              variant='contained'
              disabled={isLoadingMusicAlbum}
              loading={isSubmitting}
              fullWidth
            >
              Submit
            </LoadingButton>
          </>
        )}
      </FormContainer>
    </MainLayout>
  );
};

export default EditMusicAlbum;
