import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import { CircularProgress, Paper, Typography } from '@mui/material';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { useSnackbar } from 'notistack';
import {
  AutocompleteElement,
  CheckboxElement,
  FormContainer,
  TextFieldElement,
  useForm,
} from 'react-hook-form-mui';
import { z } from 'zod';

import { GenericHeader, MainLayout } from '~/components';
import {
  cacheCollection,
  charactersCollection,
  db,
  gamesCollection,
} from '~/configs';
import {
  CharacterCacheSchema,
  CharacterSchema,
  characterSchema,
} from '~/schemas';

const EditCharacter = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [charactersCache, setCharactersCache] = useState<
    Record<string, CharacterCacheSchema>
  >({});
  const [isLoadingCharactersCache, setIsLoadingCharacterCache] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(cacheCollection, 'characters'),
      (docSnap) => {
        setCharactersCache(docSnap.data() || {});
        setIsLoadingCharacterCache(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const [lastCharacterId, setLastCharacterId] = useState<string | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  const [currentCharacterData, setCurrentCharacterData] =
    useState<CharacterSchema | null>(null);

  const schema = characterSchema
    .omit({
      imageGalleryPaths: true,
      gameIds: true,
      cachedGameNames: true,
      updatedAt: true,
    })
    .extend({
      id: z.string().nullable(),
      name: z.string().min(1),
      customSlug: z.boolean(),
    });

  type Schema = z.infer<typeof schema> & {
    id: string | null;
  };

  const formContext = useForm<Schema>({
    defaultValues: {
      id: '',
      customSlug: false,
      name: '',
      category: '',
      description: '',
      descriptionSourceName: '',
      descriptionSourceUrl: '',
      containsSpoilers: false,
      accentColor: '#000000',
      imageDirection: 'left',
    },
    resolver: zodResolver(schema),
  });

  const {
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
    handleSubmit,
  } = formContext;

  const currentId = watch('id');

  const handleSave = async ({
    id,
    name,
    imageDirection,
    accentColor,
    ...rest
  }: Schema) => {
    if (!id) return;
    try {
      const characterDocRef = doc(charactersCollection, id);

      const batch = writeBatch(db);

      // update the character doc
      batch.update(characterDocRef, {
        name,
        imageDirection,
        accentColor,
        // imageGalleryPaths: [],
        // gameIds: [],
        // cachedGameNames: {},
        updatedAt: serverTimestamp(),
        ...rest,
      });

      // update the characters cache
      if (
        currentCharacterData?.name !== name ||
        currentCharacterData?.imageDirection !== imageDirection ||
        currentCharacterData?.accentColor !== accentColor
      ) {
        const newCharacterCacheData = {
          name,
          imageDirection,
          accentColor,
        };

        // cache collection
        batch.update(doc(cacheCollection, 'characters'), {
          [id]: newCharacterCacheData,
        });

        // game collection
        currentCharacterData?.gameIds.forEach((gameId) => {
          batch.update(doc(gamesCollection, gameId), {
            [`cachedCharacters.${id}`]: newCharacterCacheData,
          });
        });
      }

      await batch.commit();

      // don't wait for onSnapshot to update the characterNames state
      setCharactersCache((prev) => ({
        ...prev,
        [id]: {
          name,
          imageDirection,
          accentColor,
        },
      }));

      reset();

      enqueueSnackbar('Character edited.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to edit character.', { variant: 'error' });
      console.error(err);
    }
  };

  const changeCharacter = async (id: string) => {
    try {
      setIsLoadingCharacter(true);
      const characterSnap = await getDoc(doc(charactersCollection, id));
      const character = characterSnap.data();

      if (character) {
        const {
          imageGalleryPaths,
          gameIds,
          cachedGameNames,
          updatedAt,
          ...rest
        } = character;

        setCurrentCharacterData(character);
        reset({
          ...rest,
          id,
        });
        setLastCharacterId(id);
      } else {
        setCurrentCharacterData({
          name: '',
          category: '',
          description: '',
          descriptionSourceName: '',
          descriptionSourceUrl: '',
          containsSpoilers: false,
          accentColor: '#000000',
          imageGalleryPaths: [],
          imageDirection: 'left',
          updatedAt: null,
          gameIds: [],
          cachedGameNames: {},
        });
        reset({
          id: '',
          customSlug: false,
          name: '',
          category: '',
          description: '',
          descriptionSourceName: '',
          descriptionSourceUrl: '',
          containsSpoilers: false,
          accentColor: '#000000',
          imageDirection: 'left',
        });
        setLastCharacterId(id);
      }
    } catch (err) {
      enqueueSnackbar('Failed to fetch character data.', {
        variant: 'error',
      });
      setValue('id', lastCharacterId);
      console.error(err);
    } finally {
      setIsLoadingCharacter(false);
    }
  };

  return (
    <MainLayout title='Edit Character'>
      <GenericHeader title='Edit Character' gutterBottom />
      <FormContainer
        formContext={formContext}
        handleSubmit={handleSubmit(handleSave, (err) => console.error(err))}
      >
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Selection</Typography>
          <AutocompleteElement
            name='id'
            label='Character'
            options={Object.entries(charactersCache).map(([id, { name }]) => ({
              id,
              label: name,
            }))}
            loading={isLoadingCharactersCache}
            autocompleteProps={{
              onChange: (_, v) => changeCharacter(v.id),
              fullWidth: true,
            }}
            textFieldProps={{
              margin: 'normal',
            }}
            required
            matchId
          />
        </Paper>
        {isLoadingCharacter && <CircularProgress />}
        {!!currentId && !isLoadingCharacter && (
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
              <TextFieldElement
                name='category'
                label='Category'
                fullWidth
                margin='normal'
              />
              <TextFieldElement
                name='accentColor'
                label='Accent Color'
                fullWidth
                margin='normal'
                type='color'
                helperText='This will be used for the character and game page.'
              />
              <AutocompleteElement
                name='imageDirection'
                label='Image Direction'
                options={[
                  { id: 'left', label: 'Left' },
                  { id: 'right', label: 'Right' },
                ]}
                autocompleteProps={{ fullWidth: true, disableClearable: true }}
                textFieldProps={{ margin: 'normal' }}
                matchId
                required
              />
              <CheckboxElement
                name='containsSpoilers'
                label='Character info contains spoilers'
              />
            </Paper>
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Typography variant='h2'>Description</Typography>
              <TextFieldElement
                name='description'
                label='Description'
                fullWidth
                multiline
                minRows={3}
                margin='normal'
              />
              <TextFieldElement
                name='descriptionSourceName'
                label='Description Source Name'
                fullWidth
                margin='normal'
              />
              <TextFieldElement
                name='descriptionSourceUrl'
                label='Description Source URL'
                fullWidth
                margin='normal'
              />
            </Paper>
            <LoadingButton
              type='submit'
              variant='contained'
              disabled={isLoadingCharacter}
              loading={isSubmitting || isLoadingCharactersCache}
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

export default EditCharacter;
