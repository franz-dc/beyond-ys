import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import { Paper, Typography } from '@mui/material';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { useSnackbar } from 'notistack';
import {
  FormContainer,
  SwitchElement,
  TextFieldElement,
  useForm,
} from 'react-hook-form-mui';
import slugify from 'slugify';
import { z } from 'zod';

import { GenericHeader, MainLayout } from '~/components';
import { cacheCollection, db, musicAlbumsCollection } from '~/configs';

const AddMusicAlbum = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [musicAlbumNames, setMusicAlbumNames] = useState<
    Record<string, string>
  >({});

  // doing this in case someone else added an album while the user is
  // filling this form. this will update the validation in real time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(cacheCollection, 'musicAlbumNames'),
      (docSnap) => {
        setMusicAlbumNames(docSnap.data() || {});
      }
    );

    return () => unsubscribe();
  }, []);

  const schema = z
    .object({
      id: z
        .string()
        .min(1)
        .refine((id) => !musicAlbumNames[id], {
          message: 'Slug is already taken.',
        }),
      name: z.string().min(1),
      customSlug: z.boolean(),
    })
    .passthrough();

  type Schema = z.infer<typeof schema> & {
    id: string | null;
  };

  const formContext = useForm<Schema>({
    defaultValues: {
      id: '',
      name: '',
      customSlug: false,
    },
    resolver: zodResolver(schema),
  });

  const {
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
    handleSubmit,
  } = formContext;

  const handleSave = async ({ id, name }: Schema) => {
    // check if id is already taken (using the musicAlbumNames cache)
    // failsafe in case the user somehow bypasses the form validation
    if (musicAlbumNames[id]) {
      enqueueSnackbar(`Slug '${id}' is already taken.`, {
        variant: 'error',
      });
      return;
    }

    try {
      const albumInfoDocRef = doc(musicAlbumsCollection, id);

      const batch = writeBatch(db);

      // create the music album doc and fill the rest with blank data
      batch.set(albumInfoDocRef, {
        name,
        musicIds: [],
        cachedMusic: {},
        updatedAt: serverTimestamp(),
      });

      // update the musicAlbumNames cache
      batch.update(doc(cacheCollection, 'musicAlbumNames'), {
        [id]: name,
      });

      await batch.commit();

      // don't wait for onSnapshot to update the albumNames state
      setMusicAlbumNames((prev) => ({ ...prev, [id]: name }));

      reset();

      enqueueSnackbar('Music album added successfully.', {
        variant: 'success',
      });
    } catch (err) {
      enqueueSnackbar('Failed to add music album.', { variant: 'error' });
      console.error(err);
    }
  };

  return (
    <MainLayout title='Add Music Album'>
      <GenericHeader title='Add Music Album' gutterBottom />
      <FormContainer
        formContext={formContext}
        handleSubmit={handleSubmit(handleSave, (err) => console.error(err))}
      >
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2' sx={{ mb: 1 }}>
            Basic Info
          </Typography>
          <SwitchElement name='customSlug' label='Use custom slug' />
          <TextFieldElement
            name='id'
            label='Slug'
            required
            fullWidth
            margin='normal'
            disabled={!watch('customSlug')}
          />
          <TextFieldElement
            name='name'
            label='Name'
            required
            fullWidth
            margin='normal'
            onChange={(e) => {
              const name = e.target.value;
              const id = slugify(name, { lower: true });

              setValue('id', id, { shouldValidate: true });
            }}
          />
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

export default AddMusicAlbum;
