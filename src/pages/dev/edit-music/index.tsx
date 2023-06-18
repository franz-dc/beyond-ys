import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  arrayRemove,
  arrayUnion,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { useSnackbar } from 'notistack';
import {
  AutocompleteElement,
  FormContainer,
  TextFieldElement,
  useFieldArray,
  useForm,
} from 'react-hook-form-mui';
import { z } from 'zod';

import { GenericHeader, MainLayout } from '~/components';
import {
  cacheCollection,
  db,
  gamesCollection,
  musicAlbumsCollection,
  musicCollection,
} from '~/configs';
import { MusicCacheSchema, MusicSchema, musicSchema } from '~/schemas';

const EditMusic = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [musicAlbumNames, setMusicAlbumNames] = useState<
    Record<string, string>
  >({});
  const [isLoadingMusicAlbumNames, setIsLoadingMusicAlbumNames] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(cacheCollection, 'musicAlbumNames'),
      (docSnap) => {
        setMusicAlbumNames(docSnap.data() || {});
        setIsLoadingMusicAlbumNames(false);
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

  const [staffNames, setStaffNames] = useState<Record<string, string>>({});
  const [isLoadingStaffNames, setIsLoadingStaffNames] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(cacheCollection, 'staffNames'),
      (docSnap) => {
        setStaffNames(docSnap.data() || {});
        setIsLoadingStaffNames(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const schema = musicSchema
    .omit({
      updatedAt: true,
      dependentGameIds: true,
      // duration to be converted when saving
      duration: true,
      // conform to useFieldArray's format
      composerIds: true,
      arrangerIds: true,
    })
    .extend({
      id: z.string().nullable(),
      hours: z.number().int().min(0).default(0),
      minutes: z.number().int().min(0).max(59).default(0),
      seconds: z.number().int().min(0).max(59).default(0),
      composerIds: z.object({ value: z.string().min(1) }).array(),
      arrangerIds: z.object({ value: z.string().min(1) }).array(),
    });

  type Schema = z.infer<typeof schema>;

  const formContext = useForm<Schema>({
    defaultValues: {
      title: '',
      albumId: '',
      composerIds: [],
      arrangerIds: [],
      otherArtists: [],
      hours: 0,
      minutes: 0,
      seconds: 0,
      youtubeId: '',
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
    handleSubmit,
  } = formContext;

  const currentId = watch('id');

  const {
    fields: composers,
    append: appendComposer,
    remove: removeComposer,
    swap: swapComposer,
  } = useFieldArray({
    control,
    name: 'composerIds',
  });

  const {
    fields: arrangers,
    append: appendArranger,
    remove: removeArranger,
    swap: swapArranger,
  } = useFieldArray({
    control,
    name: 'arrangerIds',
  });

  const {
    fields: otherArtists,
    append: appendOtherArtist,
    remove: removeOtherArtist,
    swap: swapOtherArtist,
  } = useFieldArray({
    control,
    name: 'otherArtists',
  });

  const handleSave = async ({
    id,
    title,
    albumId,
    composerIds,
    arrangerIds,
    otherArtists,
    hours,
    minutes,
    seconds,
    youtubeId,
  }: Schema) => {
    if (!id) return;
    try {
      const batch = writeBatch(db);

      const dependentGameIds = currentMusicData?.dependentGameIds || [];

      const newData = {
        id,
        title,
        albumId,
        composerIds: composerIds.map(({ value }) => value),
        arrangerIds: arrangerIds.map(({ value }) => value),
        otherArtists,
        duration: hours * 3600 + minutes * 60 + seconds,
        youtubeId,
        updatedAt: serverTimestamp(),
        dependentGameIds,
      };

      // update the music doc
      batch.update(doc(musicCollection, id), newData);

      // update all game docs that depend on this music
      dependentGameIds.forEach((gameId) => {
        batch.update(doc(gamesCollection, gameId), {
          [`cachedSoundtracks.${id}`]: newData,
        });
      });

      // update the music cache if the title or albumId has changed
      if (
        currentMusicData?.albumId !== albumId ||
        currentMusicData?.title !== title
      ) {
        batch.update(doc(cacheCollection, 'music'), {
          [id]: {
            title,
            albumId,
          },
        });
      }

      // update the music album docs if the albumId has changed
      if (currentMusicData?.albumId !== albumId) {
        // remove the music from the old album
        if (currentMusicData?.albumId) {
          batch.update(doc(musicAlbumsCollection, currentMusicData.albumId), {
            musicIds: arrayRemove(id),
            [`cachedMusic.${id}`]: deleteField(),
          });
        }

        // add the music to the new album
        if (albumId) {
          batch.update(doc(musicAlbumsCollection, albumId), {
            musicIds: arrayUnion(id),
            [`cachedMusic.${id}`]: newData,
          });
        }
      }

      await batch.commit();

      setCurrentMusicData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...newData,
        };
      });

      enqueueSnackbar('Music updated successfully.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to update music.', { variant: 'error' });
      console.error(err);
    }
  };

  const [lastMusicId, setLastMusicId] = useState<string | null>(null);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [currentMusicData, setCurrentMusicData] = useState<MusicSchema | null>(
    null
  );

  const changeMusic = async (id: string) => {
    try {
      setIsLoadingMusic(true);
      const musicSnap = await getDoc(doc(musicCollection, id));
      const music = musicSnap.data();

      if (music) {
        const {
          composerIds,
          arrangerIds,
          duration,
          updatedAt,
          dependentGameIds,
          ...rest
        } = music;

        setCurrentMusicData(music);
        reset({
          ...rest,
          id,
          hours: Math.floor(duration / 3600),
          minutes: Math.floor((duration % 3600) / 60),
          seconds: duration % 60,
          composerIds: composerIds.map((value) => ({ value })),
          arrangerIds: arrangerIds.map((value) => ({ value })),
        });
        setLastMusicId(id);
      } else {
        setCurrentMusicData({
          title: '',
          albumId: '',
          composerIds: [],
          arrangerIds: [],
          otherArtists: [],
          duration: 0,
          youtubeId: '',
          updatedAt: null,
          dependentGameIds: [],
        });
        reset({
          id,
          title: '',
          albumId: '',
          composerIds: [],
          arrangerIds: [],
          otherArtists: [],
          hours: 0,
          minutes: 0,
          seconds: 0,
          youtubeId: '',
        });
        setLastMusicId(id);
      }
    } catch (err) {
      enqueueSnackbar('Failed to fetch music data.', {
        variant: 'error',
      });
      setValue('id', lastMusicId);
      console.error(err);
    } finally {
      setIsLoadingMusic(false);
    }
  };

  return (
    <MainLayout title='Edit Music'>
      <GenericHeader title='Edit Music' gutterBottom />
      <FormContainer
        formContext={formContext}
        handleSubmit={handleSubmit(handleSave, (err) => console.error(err))}
      >
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Selection</Typography>
          <AutocompleteElement
            name='id'
            label='Music'
            options={Object.entries(musicCache).map(
              ([id, { title, albumId }]) => {
                const foundAlbum = musicAlbumNames[albumId];

                const albumName =
                  albumId === '' ? 'No album' : foundAlbum || 'Unknown album';

                return {
                  id,
                  label: `${title} (${albumName})`,
                };
              }
            )}
            loading={isLoadingMusicCache}
            autocompleteProps={{
              onChange: (_, v) => changeMusic(v.id),
              fullWidth: true,
            }}
            textFieldProps={{
              margin: 'normal',
            }}
            required
            matchId
          />
        </Paper>
        {isLoadingMusic && <CircularProgress />}
        {!!currentId && !isLoadingMusic && (
          <>
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Typography variant='h2'>Basic Info</Typography>
              <TextFieldElement
                name='title'
                label='Title'
                required
                fullWidth
                margin='normal'
              />
              <AutocompleteElement
                name='albumId'
                label='Album'
                options={[
                  {
                    id: '',
                    label: 'No Album',
                  },
                  ...Object.entries(musicAlbumNames).map(([id, label]) => ({
                    id,
                    label,
                  })),
                ]}
                loading={isLoadingMusicAlbumNames}
                autocompleteProps={{
                  fullWidth: true,
                  onChange: (_, value) => {
                    if (!value) {
                      setValue('albumId', '');
                    }
                  },
                }}
                textFieldProps={{
                  margin: 'normal',
                }}
                matchId
              />
              <TextFieldElement
                name='youtubeId'
                label='YouTube ID'
                fullWidth
                margin='normal'
              />
            </Paper>
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Typography variant='h2' sx={{ mb: 2 }}>
                Duration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextFieldElement
                    name='hours'
                    label='Hours'
                    type='number'
                    required
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: 0,
                    }}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        setValue('hours', 0);
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextFieldElement
                    name='minutes'
                    label='Minutes'
                    type='number'
                    required
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: 0,
                      max: 59,
                    }}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        setValue('minutes', 0);
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextFieldElement
                    name='seconds'
                    label='Seconds'
                    type='number'
                    required
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: 0,
                      max: 59,
                    }}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        setValue('seconds', 0);
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Typography variant='h2'>Composers</Typography>
              {composers.map((composer, idx) => (
                <Stack
                  key={composer.id}
                  direction='row'
                  spacing={2}
                  sx={{ mb: 2 }}
                >
                  <AutocompleteElement
                    name={`composerIds.${idx}.value`}
                    label={`Composer ${idx + 1}`}
                    options={Object.entries(staffNames)
                      .map(([id, label]) => ({
                        id,
                        label,
                      }))
                      .filter(
                        ({ id }) =>
                          !composers.some((c) => c.value === id) ||
                          id === composer.value
                      )}
                    loading={isLoadingStaffNames}
                    autocompleteProps={{
                      fullWidth: true,
                    }}
                    textFieldProps={{
                      margin: 'normal',
                    }}
                    matchId
                  />
                  <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
                    <Button
                      variant='outlined'
                      onClick={() => removeComposer(idx)}
                      fullWidth
                      sx={{ mt: '16px !important', height: 56 }}
                    >
                      Remove
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        if (idx === 0) return;
                        swapComposer(idx, idx - 1);
                      }}
                      disabled={idx === 0}
                      fullWidth
                      sx={{ mt: '16px !important', height: 56 }}
                    >
                      Up
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        if (idx === composers.length - 1) return;
                        swapComposer(idx, idx + 1);
                      }}
                      disabled={idx === composers.length - 1}
                      fullWidth
                      sx={{ mt: '16px !important', height: 56 }}
                    >
                      Down
                    </Button>
                  </Stack>
                </Stack>
              ))}
              <Button
                variant='outlined'
                onClick={() => appendComposer({ value: '' })}
                fullWidth
                disabled={composers.length === Object.keys(staffNames).length}
              >
                Edit Composer
              </Button>
            </Paper>
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Typography variant='h2'>Arrangers</Typography>
              {arrangers.map((arranger, idx) => (
                <Stack
                  key={arranger.id}
                  direction='row'
                  spacing={2}
                  sx={{ mb: 2 }}
                >
                  <AutocompleteElement
                    name={`arrangerIds.${idx}.value`}
                    label={`Arranger ${idx + 1}`}
                    options={Object.entries(staffNames)
                      .map(([id, label]) => ({
                        id,
                        label,
                      }))
                      .filter(
                        ({ id }) =>
                          !arrangers.some((c) => c.value === id) ||
                          id === arranger.value
                      )}
                    loading={isLoadingStaffNames}
                    autocompleteProps={{
                      fullWidth: true,
                    }}
                    textFieldProps={{
                      margin: 'normal',
                    }}
                    matchId
                  />
                  <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
                    <Button
                      variant='outlined'
                      onClick={() => removeArranger(idx)}
                      fullWidth
                      sx={{ mt: '16px !important', height: 56 }}
                    >
                      Remove
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        if (idx === 0) return;
                        swapArranger(idx, idx - 1);
                      }}
                      disabled={idx === 0}
                      fullWidth
                      sx={{ mt: '16px !important', height: 56 }}
                    >
                      Up
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        if (idx === arrangers.length - 1) return;
                        swapArranger(idx, idx + 1);
                      }}
                      disabled={idx === arrangers.length - 1}
                      fullWidth
                      sx={{ mt: '16px !important', height: 56 }}
                    >
                      Down
                    </Button>
                  </Stack>
                </Stack>
              ))}
              <Button
                variant='outlined'
                onClick={() => appendArranger({ value: '' })}
                fullWidth
                disabled={arrangers.length === Object.keys(staffNames).length}
              >
                Edit Arranger
              </Button>
            </Paper>
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Typography variant='h2'>Other Artists</Typography>
              {otherArtists.map((otherArtist, idx) => (
                <Stack
                  key={otherArtist.id}
                  direction='row'
                  spacing={2}
                  sx={{ mb: 2 }}
                >
                  <AutocompleteElement
                    name={`otherArtists.${idx}.staffId`}
                    label={`Other Artist ${idx + 1}`}
                    options={Object.entries(staffNames)
                      .map(([id, label]) => ({
                        id,
                        label,
                      }))
                      .filter(
                        ({ id }) =>
                          !otherArtists.some((c) => c.staffId === id) ||
                          id === otherArtist.staffId
                      )}
                    loading={isLoadingStaffNames}
                    autocompleteProps={{
                      fullWidth: true,
                    }}
                    textFieldProps={{
                      margin: 'normal',
                    }}
                    matchId
                  />
                  <Box sx={{ width: '100%' }}>
                    <TextFieldElement
                      name={`otherArtists.${idx}.role`}
                      label={`Other Artist ${idx + 1} Role`}
                      fullWidth
                      margin='normal'
                    />
                  </Box>
                  <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
                    <Button
                      variant='outlined'
                      onClick={() => removeOtherArtist(idx)}
                      fullWidth
                      sx={{ mt: '16px !important', height: 56 }}
                    >
                      Remove
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        if (idx === 0) return;
                        swapOtherArtist(idx, idx - 1);
                      }}
                      disabled={idx === 0}
                      fullWidth
                      sx={{ mt: '16px !important', height: 56 }}
                    >
                      Up
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        if (idx === otherArtists.length - 1) return;
                        swapOtherArtist(idx, idx + 1);
                      }}
                      disabled={idx === otherArtists.length - 1}
                      fullWidth
                      sx={{ mt: '16px !important', height: 56 }}
                    >
                      Down
                    </Button>
                  </Stack>
                </Stack>
              ))}
              <Button
                variant='outlined'
                onClick={() => appendOtherArtist({ staffId: '', role: '' })}
                fullWidth
                disabled={
                  otherArtists.length === Object.keys(staffNames).length
                }
              >
                Edit Other Artist
              </Button>
            </Paper>
            <LoadingButton
              type='submit'
              variant='contained'
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

export default EditMusic;
