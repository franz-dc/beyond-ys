import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
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
import { z } from 'zod';

import { GenericHeader, MainLayout } from '~/components';
import {
  cacheCollection,
  db,
  musicAlbumsCollection,
  musicCollection,
} from '~/configs';
import {
  MusicAlbumCacheSchema,
  MusicAlbumSchema,
  MusicCacheSchema,
  musicAlbumSchema,
} from '~/schemas';

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
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    reset,
    setValue,
    watch,
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

  const currentId = watch('id');

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
        });
        setLastMusicAlbumId(id);
      } else {
        setCurrentMusicAlbumData({
          name: '',
          musicIds: [],
          cachedMusic: {},
          releaseDate: '',
          updatedAt: null,
        });
        reset({
          id,
          name: '',
          musicIds: [],
          releaseDate: null,
          releaseDatePrecision: 'unknown',
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
    ...values
  }: Schema) => {
    if (!id) return;
    try {
      const albumId = id;

      const cachedMusic = {
        ...currentMusicAlbumData?.cachedMusic,
      };

      const musicAlbumDocRef = doc(musicAlbumsCollection, id);

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

      const batch = writeBatch(db);

      // update musicAlbums cache if name is changed
      if (
        currentMusicAlbumData?.name !== values.name ||
        currentMusicAlbumData?.releaseDate !== formattedReleaseDate
      ) {
        const musicAlbumCacheDocRef = doc(cacheCollection, 'musicAlbums');

        batch.update(musicAlbumCacheDocRef, {
          [id]: {
            name: values.name,
            releaseDate: formattedReleaseDate,
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

        // add new music to music album doc's cachedMusic
        const newMusicQuery = query(
          musicCollection,
          where(documentId(), 'in', addedMusicIds)
        );
        const newMusicQuerySnap = await getDocs(newMusicQuery);

        newMusicQuerySnap.forEach((doc) => {
          if (!doc.exists()) return;
          cachedMusic[doc.id] = {
            ...doc.data(),
            albumId,
          };
        });
      }

      // update musicAlbum doc
      batch.update(musicAlbumDocRef, {
        ...values,
        musicIds: values.musicIds.map(({ value }) => value),
        updatedAt: serverTimestamp(),
        releaseDate: formattedReleaseDate,
        // @ts-ignore
        cachedMusic,
      });

      // update music cache if there are changes
      if (Object.keys(changedMusicCacheItems).length) {
        batch.update(musicCacheDocRef, changedMusicCacheItems);
      }

      await batch.commit();

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
        },
      }));

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
