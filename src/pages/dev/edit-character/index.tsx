import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
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
  useFieldArray,
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
import { COUNTRIES } from '~/constants';
import {
  CharacterCacheSchema,
  CharacterSchema,
  GameCacheSchema,
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

  const [cachedGames, setCachedGames] = useState<
    Record<string, GameCacheSchema>
  >({});
  const [isLoadingCachedGames, setIsLoadingCachedGames] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(cacheCollection, 'games'), (docSnap) => {
      setCachedGames(docSnap.data() || {});
      setIsLoadingCachedGames(false);
    });

    return () => unsubscribe();
  }, []);

  const [lastCharacterId, setLastCharacterId] = useState<string | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  const [currentCharacterData, setCurrentCharacterData] =
    useState<CharacterSchema | null>(null);

  const schema = characterSchema
    .omit({
      extraImages: true,
      gameIds: true,
      cachedGames: true,
      hasMainImage: true,
      hasAvatar: true,
      updatedAt: true,
    })
    .extend({
      id: z.string().nullable(),
      gameIds: z.object({ value: z.string().min(1) }).array(),
    });

  type Schema = z.infer<typeof schema> & {
    id: string | null;
  };

  const formContext = useForm<Schema>({
    defaultValues: {
      id: '',
      name: '',
      category: '',
      description: '',
      descriptionSourceName: '',
      descriptionSourceUrl: '',
      containsSpoilers: false,
      accentColor: '#161a22',
      imageDirection: 'left',
      gameIds: [],
      voiceActors: [],
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
    handleSubmit,
  } = formContext;

  const {
    fields: voiceActors,
    append: appendVoiceActor,
    remove: removeVoiceActor,
    swap: swapVoiceActor,
  } = useFieldArray({
    control,
    name: 'voiceActors',
  });

  // no add/remove for games, only swap
  // this gets added/removed when the character is added/removed from a game
  const { fields: gameIds, swap: swapGameId } = useFieldArray({
    control,
    name: 'gameIds',
  });

  const currentId = watch('id');

  const handleSave = async ({
    id,
    name,
    category,
    imageDirection,
    accentColor,
    gameIds,
    ...rest
  }: Schema) => {
    if (!id) return;
    try {
      const characterDocRef = doc(charactersCollection, id);

      const formattedGameIds = gameIds.map(({ value }) => value);

      const batch = writeBatch(db);

      // update the character doc
      batch.update(characterDocRef, {
        name,
        category,
        imageDirection,
        accentColor,
        gameIds: formattedGameIds,
        updatedAt: serverTimestamp(),
        ...rest,
      });

      // update the characters cache
      if (
        currentCharacterData?.name !== name ||
        currentCharacterData?.category !== category ||
        currentCharacterData?.imageDirection !== imageDirection ||
        currentCharacterData?.accentColor !== accentColor
      ) {
        const newCharacterCacheData = {
          name,
          category,
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
          ...prev[id],
          name,
          category,
          imageDirection,
          accentColor,
        },
      }));

      setCurrentCharacterData((prev) => ({
        ...prev!,
        name,
        category,
        imageDirection,
        accentColor,
        gameIds: formattedGameIds,
      }));

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
        const { extraImages, gameIds, cachedGames, updatedAt, ...rest } =
          character;

        setCurrentCharacterData(character);
        reset({
          ...rest,
          gameIds: gameIds.map((value) => ({ value })),
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
          accentColor: '#161a22',
          extraImages: [],
          imageDirection: 'left',
          voiceActors: [],
          updatedAt: null,
          gameIds: [],
          cachedGames: {},
          hasMainImage: false,
          hasAvatar: false,
        });
        reset({
          id: '',
          name: '',
          category: '',
          description: '',
          descriptionSourceName: '',
          descriptionSourceUrl: '',
          containsSpoilers: false,
          accentColor: '#161a22',
          imageDirection: 'left',
          gameIds: [],
          voiceActors: [],
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
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Typography variant='h2'>Game Involvements</Typography>
              {gameIds.length === 0 && (
                <Typography color='warning.main' sx={{ mb: 2 }}>
                  No games added yet.
                </Typography>
              )}
              {gameIds.map((gameId, idx) => (
                <Stack key={gameId.id} direction='row' spacing={2}>
                  <TextField
                    value={
                      isLoadingCachedGames
                        ? 'Loading...'
                        : cachedGames[gameId.value]?.name ||
                          `Unknown game (${gameId.value})`
                    }
                    label={`Game ${idx + 1}`}
                    disabled
                    fullWidth
                    margin='normal'
                  />
                  <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        if (idx === 0) return;
                        swapGameId(idx, idx - 1);
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
                        if (idx === gameIds.length - 1) return;
                        swapGameId(idx, idx + 1);
                      }}
                      disabled={idx === gameIds.length - 1}
                      fullWidth
                      sx={{ mt: '16px !important', height: 56 }}
                    >
                      Down
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Paper>
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='h2'>Voice Actors</Typography>
                {voiceActors.length === 0 && (
                  <Typography color='warning.main'>
                    No voice actors added yet.
                  </Typography>
                )}
              </Box>
              {voiceActors.map((voiceActor, idx) => (
                <Paper
                  key={voiceActor.id}
                  sx={{ mb: 2, p: 2, backgroundColor: 'background.default' }}
                >
                  <Stack direction='column' sx={{ mt: -1 }}>
                    <AutocompleteElement
                      name={`voiceActors.${idx}.staffId`}
                      label={`Voice Actor ${idx + 1}`}
                      options={Object.entries(staffNames)
                        .map(([id, label]) => ({
                          id,
                          label,
                        }))
                        .filter(
                          ({ id }) =>
                            // remove voiceActors that are already selected
                            !voiceActors.some((g) => g.staffId === id) ||
                            voiceActor.staffId === id
                        )}
                      loading={isLoadingStaffNames}
                      autocompleteProps={{ fullWidth: true }}
                      textFieldProps={{ margin: 'normal' }}
                      matchId
                      required
                    />
                    <AutocompleteElement
                      name={`voiceActors.${idx}.language`}
                      label={`Voice Actor ${idx + 1} Language`}
                      options={COUNTRIES.map(({ language }) => language)}
                      autocompleteProps={{
                        fullWidth: true,
                        // freeSolo: true,
                      }}
                      textFieldProps={{
                        margin: 'normal',
                      }}
                      required
                    />
                    <TextFieldElement
                      name={`voiceActors.${idx}.description`}
                      label={`Voice Actor ${idx + 1} Description`}
                      fullWidth
                      margin='normal'
                    />
                    <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
                      <Button
                        variant='outlined'
                        onClick={() => removeVoiceActor(idx)}
                        fullWidth
                      >
                        Remove
                      </Button>
                      <Button
                        variant='outlined'
                        onClick={() => {
                          if (idx === 0) return;
                          swapVoiceActor(idx, idx - 1);
                        }}
                        disabled={idx === 0}
                        fullWidth
                      >
                        Up
                      </Button>
                      <Button
                        variant='outlined'
                        onClick={() => {
                          if (idx === voiceActors.length - 1) return;
                          swapVoiceActor(idx, idx + 1);
                        }}
                        disabled={idx === voiceActors.length - 1}
                        fullWidth
                      >
                        Down
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
              <LoadingButton
                variant='outlined'
                loading={isLoadingStaffNames}
                onClick={() =>
                  appendVoiceActor({
                    staffId: '',
                    language: '',
                    description: '',
                  })
                }
                fullWidth
                disabled={
                  voiceActors.length >= Object.entries(staffNames).length
                }
                sx={{ mt: 1 }}
              >
                Add Voice Actor
              </LoadingButton>
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
