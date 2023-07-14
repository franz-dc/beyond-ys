import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { format } from 'date-fns';
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
import { useSnackbar } from 'notistack';
import {
  AutocompleteElement,
  DatePickerElement,
  FormContainer,
  RadioButtonGroup,
  TextFieldElement,
  useFieldArray,
  useForm,
} from 'react-hook-form-mui';
import slugify from 'slugify';
import { z } from 'zod';

import { GenericHeader, MainLayout, SwitchElement } from '~/components';
import {
  cacheCollection,
  db,
  musicAlbumsCollection,
  musicCollection,
} from '~/configs';
import {
  MusicAlbumCacheSchema,
  MusicCacheSchema,
  MusicSchema,
  musicAlbumSchema,
} from '~/schemas';

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
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    watch,
    getValues,
    setValue,
    reset,
    formState: { isSubmitting },
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

    try {
      const albumInfoDocRef = doc(musicAlbumsCollection, id);

      const batch = writeBatch(db);

      // populate cachedMusic from musicIds
      const formattedMusicIds = musicIds.map(({ value }) => value);

      const cachedMusic: Record<string, MusicSchema> = {};

      if (formattedMusicIds.length > 0) {
        const newMusicQuery = query(
          musicCollection,
          where(documentId(), 'in', formattedMusicIds)
        );
        const newMusicQuerySnap = await getDocs(newMusicQuery);

        newMusicQuerySnap.forEach((doc) => {
          if (!doc.exists()) return;
          cachedMusic[doc.id] = doc.data();
        });
      }

      let formattedReleaseDate = '';

      if (releaseDate) {
        switch (releaseDatePrecision) {
          case 'day':
            formattedReleaseDate = format(new Date(releaseDate), 'yyyy-MM-dd');
            break;
          case 'month':
            formattedReleaseDate = format(new Date(releaseDate), 'yyyy-MM');
            break;
          case 'year':
            formattedReleaseDate = format(new Date(releaseDate), 'yyyy');
            break;
        }
      }

      const newData = {
        name,
        musicIds: formattedMusicIds,
        cachedMusic,
        releaseDate: formattedReleaseDate,
        updatedAt: serverTimestamp(),
      };

      // create the music album doc and fill the rest with blank data
      batch.set(albumInfoDocRef, newData);

      // update the musicAlbums cache
      batch.update(doc(cacheCollection, 'musicAlbums'), {
        [id]: {
          name,
          releaseDate: formattedReleaseDate,
        },
      });

      await batch.commit();

      // don't wait for onSnapshot to update the musicAlbumCache state
      setMusicAlbumsCache((prev) => ({
        ...prev,
        [id]: {
          name,
          releaseDate: formattedReleaseDate,
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
                  remove: /[*+~.()'"!:@/]/g,
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
          <TextFieldElement
            name='name'
            label='Name'
            required
            fullWidth
            margin='normal'
            onChange={(e) => {
              if (customSlug) return;
              const name = e.target.value;
              const id = slugify(name, {
                lower: true,
                remove: /[*+~.()'"!:@/]/g,
              });

              setValue('id', id, { shouldValidate: true });
            }}
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
          <Typography variant='h2'>Music</Typography>
          <Typography color='text.secondary'>
            Music from a different album will be overwritten by this one.
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
