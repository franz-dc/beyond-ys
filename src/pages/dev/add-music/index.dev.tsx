import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import {
  addDoc,
  arrayUnion,
  doc,
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
  auth,
  cacheCollection,
  db,
  musicAlbumsCollection,
  musicCollection,
  staffInfosCollection,
} from '~/configs';
import {
  MusicAlbumCacheSchema,
  StaffInfoCacheSchema,
  musicSchema,
} from '~/schemas';
import { revalidatePaths } from '~/utils';

const AddMusic = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [cachedMusicAlbums, setCachedMusicAlbums] = useState<
    Record<string, MusicAlbumCacheSchema>
  >({});
  const [isLoadingCachedMusicAlbums, setIsLoadingCachedMusicAlbums] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(cacheCollection, 'musicAlbums'),
      (docSnap) => {
        setCachedMusicAlbums(docSnap.data() || {});
        setIsLoadingCachedMusicAlbums(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const [staffInfoCache, setStaffInfoCache] = useState<
    Record<string, StaffInfoCacheSchema>
  >({});
  const [isLoadingStaffInfoCache, setIsLoadingStaffInfoCache] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(cacheCollection, 'staffInfo'),
      (docSnap) => {
        setStaffInfoCache(docSnap.data() || {});
        setIsLoadingStaffInfoCache(false);
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
    setValue,
    formState: { isSubmitting },
    handleSubmit,
  } = formContext;

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

      const formattedComposerIds = composerIds.map(({ value }) => value);
      const formattedArrangerIds = arrangerIds.map(({ value }) => value);

      // create the music doc and fill the rest with blank data
      const newData = {
        title,
        albumId,
        composerIds: formattedComposerIds,
        arrangerIds: formattedArrangerIds,
        otherArtists,
        duration: hours * 3600 + minutes * 60 + seconds,
        youtubeId,
        updatedAt: serverTimestamp(),
        dependentGameIds: [],
      };
      const musicDocRef = await addDoc(musicCollection, newData);

      const id = musicDocRef.id;

      const batch = writeBatch(db);

      // update the music cache
      batch.update(doc(cacheCollection, 'music'), {
        [id]: {
          title,
          albumId,
        },
      });

      // update the music album doc
      if (albumId) {
        batch.update(doc(musicAlbumsCollection, albumId), {
          musicIds: arrayUnion(id),
          [`cachedMusic.${id}`]: newData,
          updatedAt: serverTimestamp(),
        });
      }

      // update all staff data related to this music
      const staffIds = [
        // in case there are duplicate staff ids
        ...new Set([
          ...formattedComposerIds,
          ...formattedArrangerIds,
          ...otherArtists.map(({ staffId }) => staffId),
        ]),
      ];

      staffIds.forEach((staffId) => {
        batch.update(doc(staffInfosCollection, staffId), {
          musicIds: arrayUnion(id),
          [`cachedMusic.${id}`]: newData,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      await revalidatePaths(
        [
          ...(albumId ? [`music/${albumId}`] : []),
          ...staffIds.map((staffId) => `staff/${staffId}`),
        ],
        tokenRes.token
      );

      reset();

      enqueueSnackbar('Music added successfully.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to add music.', { variant: 'error' });
      console.error(err);
    }
  };

  return (
    <MainLayout title='Add Music'>
      <GenericHeader title='Add Music' gutterBottom />
      <FormContainer
        formContext={formContext}
        handleSubmit={handleSubmit(handleSave, (err) => console.error(err))}
      >
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
              ...Object.entries(cachedMusicAlbums).map(
                ([id, { name: label }]) => ({
                  id,
                  label,
                })
              ),
            ]}
            loading={isLoadingCachedMusicAlbums}
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
            <Stack key={composer.id} direction='row' spacing={2} sx={{ mb: 2 }}>
              <AutocompleteElement
                name={`composerIds.${idx}.value`}
                label={`Composer ${idx + 1}`}
                options={Object.entries(staffInfoCache)
                  .map(([id, { name: label }]) => ({
                    id,
                    label,
                  }))
                  .filter(
                    ({ id }) =>
                      !composers.some((c) => c.value === id) ||
                      id === composer.value
                  )}
                loading={isLoadingStaffInfoCache}
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
            disabled={composers.length === Object.keys(staffInfoCache).length}
          >
            Add Composer
          </Button>
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Arrangers</Typography>
          {arrangers.map((arranger, idx) => (
            <Stack key={arranger.id} direction='row' spacing={2} sx={{ mb: 2 }}>
              <AutocompleteElement
                name={`arrangerIds.${idx}.value`}
                label={`Arranger ${idx + 1}`}
                options={Object.entries(staffInfoCache)
                  .map(([id, { name: label }]) => ({
                    id,
                    label,
                  }))
                  .filter(
                    ({ id }) =>
                      !arrangers.some((c) => c.value === id) ||
                      id === arranger.value
                  )}
                loading={isLoadingStaffInfoCache}
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
            disabled={arrangers.length === Object.keys(staffInfoCache).length}
          >
            Add Arranger
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
                options={Object.entries(staffInfoCache)
                  .map(([id, { name: label }]) => ({
                    id,
                    label,
                  }))
                  .filter(
                    ({ id }) =>
                      !otherArtists.some((c) => c.staffId === id) ||
                      id === otherArtist.staffId
                  )}
                loading={isLoadingStaffInfoCache}
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
              otherArtists.length === Object.keys(staffInfoCache).length
            }
          >
            Add Other Artist
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
      </FormContainer>
    </MainLayout>
  );
};

export default AddMusic;
