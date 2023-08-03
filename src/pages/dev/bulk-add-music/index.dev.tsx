import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import { Paper, Typography } from '@mui/material';
import {
  arrayUnion,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { useSnackbar } from 'notistack';
import { FormContainer, TextFieldElement, useForm } from 'react-hook-form-mui';
import { z } from 'zod';

import { GenericHeader, MainLayout } from '~/components';
import {
  cacheCollection,
  db,
  musicAlbumsCollection,
  musicCollection,
  staffInfosCollection,
} from '~/configs';
import { MusicSchema, musicSchema } from '~/schemas';

const BulkAddMusic = () => {
  const { enqueueSnackbar } = useSnackbar();

  const schema = z.object({
    json: z
      .string()
      .refine(
        (value) => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed);
          } catch {
            return false;
          }
        },
        { message: 'Invalid JSON' }
      )
      .refine(
        (value) => {
          const status = musicSchema
            .omit({
              updatedAt: true,
              dependentGameIds: true,
            })
            .array()
            .safeParse(JSON.parse(value || '[]'));
          if (!status.success) {
            console.error(status.error);
            enqueueSnackbar('Invalid JSON data. Check console for details.', {
              variant: 'error',
            });
          }
          return status.success;
        },
        { message: 'Invalid JSON data' }
      ),
  });

  type Schema = z.infer<typeof schema>;

  const formContext = useForm<Schema>({
    defaultValues: {
      json: '',
    },
    resolver: zodResolver(schema),
  });

  const {
    reset,
    formState: { isSubmitting },
    handleSubmit,
  } = formContext;

  const handleSave = async ({ json }: Schema) => {
    try {
      const musics: Omit<MusicSchema, 'dependentGameIds' | 'updatedAt'>[] =
        JSON.parse(json);
      const batch = writeBatch(db);

      // useful for updating game soundtracks in bulk
      const musicIds: string[] = [];

      musics.forEach(
        ({
          title,
          albumId,
          composerIds,
          arrangerIds,
          otherArtists,
          duration,
          youtubeId,
        }) => {
          // create the music doc and fill the rest with blank data
          const newData = {
            title,
            albumId,
            composerIds,
            arrangerIds,
            otherArtists,
            duration,
            youtubeId,
            updatedAt: serverTimestamp(),
            dependentGameIds: [],
          };
          const musicDoc = doc(musicCollection);
          const id = musicDoc.id;
          musicIds.push(id);

          batch.set(musicDoc, newData);

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
            });
          }

          // update all staff data related to this music
          const staffIds = [
            // in case there are duplicate staff ids
            ...new Set([
              ...composerIds,
              ...arrangerIds,
              ...otherArtists.map(({ staffId }) => staffId),
            ]),
          ];

          staffIds.forEach((staffId) => {
            batch.update(doc(staffInfosCollection, staffId), {
              musicIds: arrayUnion(id),
              [`cachedMusic.${id}`]: newData,
            });
          });
        }
      );
      await batch.commit();
      reset();
      enqueueSnackbar('Music added successfully.', { variant: 'success' });
      // eslint-disable-next-line no-console
      console.log('Music IDs', musicIds);
    } catch (err) {
      enqueueSnackbar('Failed to add music.', { variant: 'error' });
      console.error(err);
    }
  };

  return (
    <MainLayout title='Bulk Add Music'>
      <GenericHeader title='Bulk Add Music' gutterBottom />
      <FormContainer
        formContext={formContext}
        handleSubmit={handleSubmit(handleSave)}
      >
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>JSON Data</Typography>
          <TextFieldElement
            name='json'
            label='Paste JSON here'
            required
            fullWidth
            margin='normal'
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

export default BulkAddMusic;
