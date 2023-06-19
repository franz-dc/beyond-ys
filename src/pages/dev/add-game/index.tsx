import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { formatISO } from 'date-fns';
import {
  addDoc,
  arrayUnion,
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
  SwitchElement,
  TextFieldElement,
  useFieldArray,
  useForm,
} from 'react-hook-form-mui';
import slugify from 'slugify';
import { z } from 'zod';

import { GenericHeader, MainLayout } from '~/components';
import {
  cacheCollection,
  charactersCollection,
  db,
  gamesCollection,
  musicCollection,
} from '~/configs';
import { GAME_PLATFORMS } from '~/constants';
import {
  CharacterCacheSchema,
  GameSchema,
  MusicCacheSchema,
  MusicSchema,
  gameSchema,
} from '~/schemas';

const AddGame = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [gameNames, setGameNames] = useState<Record<string, string>>({});
  const [isLoadingGameNames, setIsLoadingGameNames] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(cacheCollection, 'gameNames'),
      (docSnap) => {
        setGameNames(docSnap.data() || {});
        setIsLoadingGameNames(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const [musicAlbumNames, setMusicAlbumNames] = useState<
    Record<string, string>
  >({});
  const [isLoadingMusicAlbumNames, setIsLoadingMusicAlbumNames] =
    useState(true);

  // doing this in case someone else added an album while the user is
  // filling this form. this will update the validation in real time
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

  const [charactersCache, setCharactersCache] = useState<
    Record<string, CharacterCacheSchema>
  >({});
  const [isLoadingCharactersCache, setIsLoadingCharactersCache] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(cacheCollection, 'characters'),
      (docSnap) => {
        setCharactersCache(docSnap.data() || {});
        setIsLoadingCharactersCache(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const schema = gameSchema
    .omit({
      updatedAt: true,
      cachedSoundtracks: true,
      dependentCharacterIds: true,
      // conform to useFieldArray's format
      platforms: true,
      characterIds: true,
      characterSpoilerIds: true,
      soundtrackIds: true,
    })
    .extend({
      id: z.string().refine((value) => !gameNames[value], {
        message: 'Slug is already taken.',
      }),
      customSlug: z.boolean(),
      platforms: z.object({ value: z.string().min(1) }).array(),
      characterIds: z.object({ value: z.string().min(1) }).array(),
      characterSpoilerIds: z.object({ value: z.string().min(1) }).array(),
      soundtrackIds: z.object({ value: z.string().min(1) }).array(),
    });

  type Schema = z.infer<typeof schema>;

  const formContext = useForm<Schema>({
    defaultValues: {
      id: '',
      customSlug: false,
      name: '',
      category: '',
      subcategory: '',
      platforms: [],
      releaseDate: null,
      description: '',
      descriptionSourceName: '',
      descriptionSourceUrl: '',
      characterIds: [],
      characterSpoilerIds: [],
      soundtrackIds: [],
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

  const {
    fields: platforms,
    append: appendPlatform,
    remove: removePlatform,
    swap: swapPlatform,
  } = useFieldArray({
    control,
    name: 'platforms',
  });

  const {
    fields: soundtrackIds,
    append: appendSoundtrack,
    remove: removeSoundtrack,
    swap: swapSoundtrack,
  } = useFieldArray({
    control,
    name: 'soundtrackIds',
  });

  const {
    fields: characterIds,
    append: appendCharacter,
    remove: removeCharacter,
    swap: swapCharacter,
  } = useFieldArray({
    control,
    name: 'characterIds',
  });

  const [currentGameData, setCurrentGameData] = useState<GameSchema | null>(
    null
  );

  const handleSave = async ({
    id,
    name,
    category,
    subcategory,
    platforms,
    releaseDate,
    description,
    descriptionSourceName,
    descriptionSourceUrl,
    characterIds,
    characterSpoilerIds,
    soundtrackIds,
  }: Schema) => {
    // check if id is already taken (using the musicAlbumNames cache)
    // failsafe in case the user somehow bypasses the form validation
    if (musicAlbumNames[id]) {
      enqueueSnackbar(`Slug '${id}' is already taken.`, {
        variant: 'error',
      });
      return;
    }

    try {
      const batch = writeBatch(db);

      const formattedSoundtrackIds = soundtrackIds.map(({ value }) => value);
      const formattedCharacterIds = characterIds.map(({ value }) => value);

      // get all the soundtrack docs
      const cachedSoundtracks: Record<string, MusicSchema> = {};

      const newSoundtracksQuery = query(
        musicCollection,
        where(documentId(), 'in', formattedSoundtrackIds)
      );
      const newSoundtracksQuerySnap = await getDocs(newSoundtracksQuery);

      newSoundtracksQuerySnap.forEach((docSnap) => {
        if (!docSnap.exists()) return;
        // we don't care if dependentGames are not updated for cache
        // that would be another write operation just to get the game id
        cachedSoundtracks[docSnap.id] = docSnap.data();
      });

      const newData = {
        name,
        category,
        subcategory,
        platforms: platforms.map(({ value }) => value),
        releaseDate: releaseDate
          ? formatISO(releaseDate as Date, { representation: 'date' })
          : '',
        description,
        descriptionSourceName,
        descriptionSourceUrl,
        characterIds: characterIds.map(({ value }) => value),
        characterSpoilerIds: characterSpoilerIds.map(({ value }) => value),
        soundtrackIds: formattedSoundtrackIds,
        updatedAt: serverTimestamp(),
        cachedSoundtracks,
      };

      // update the game doc
      const gameDocRef = await addDoc(gamesCollection, newData);

      const id = gameDocRef.id;

      // update all character docs that depend on this game
      currentGameData?.characterIds.forEach((characterId) => {
        batch.update(doc(charactersCollection, characterId), {
          [`cachedGameNames.${id}`]: name,
        });
      });

      // update the gameName cache
      batch.update(doc(cacheCollection, 'game'), {
        [id]: name,
      });

      formattedSoundtrackIds.forEach((soundtrackId) => {
        batch.update(doc(musicCollection, soundtrackId), {
          dependentGameIds: arrayUnion(id),
        });
      });

      // update gameId from character docs
      formattedCharacterIds.forEach((characterId) => {
        batch.update(doc(charactersCollection, characterId), {
          gameIds: arrayUnion(id),
        });
      });

      await batch.commit();

      setCurrentGameData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...newData,
        };
      });

      reset();

      enqueueSnackbar('Game added successfully.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to add game.', { variant: 'error' });
      console.error(err);
    }
  };

  return (
    <MainLayout title='Add Game'>
      <GenericHeader title='Add Game' gutterBottom />
      <FormContainer
        formContext={formContext}
        handleSubmit={handleSubmit(handleSave, (err) => console.error(err))}
      >
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2' sx={{ mb: 1 }}>
            General Info
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
            onChange={(e) => {
              const name = e.target.value;
              const id = slugify(name, {
                lower: true,
                remove: /[*+~.()'"!:@]/g,
              });

              setValue('id', id, { shouldValidate: true });
            }}
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
            name='subcategory'
            label='Subcategory'
            fullWidth
            margin='normal'
          />
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
          />
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Description</Typography>
          <TextFieldElement
            name='description'
            label='Description'
            required
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
          <Typography variant='h2'>Platforms</Typography>
          {platforms.length === 0 && (
            <Typography color='warning.main'>
              No platforms added yet.
            </Typography>
          )}
          {platforms.map((platformId, idx) => (
            <Stack direction='row' spacing={2} key={platformId.id}>
              <AutocompleteElement
                name={`platforms.${idx}.value`}
                label={`Platform ${idx + 1}`}
                options={Object.entries(GAME_PLATFORMS)
                  .map(([id, { name }]) => ({ id, label: name }))
                  .filter(
                    ({ id }) =>
                      // remove platform that are already added
                      !platforms.some((m) => m.value === id) ||
                      platformId.value === id
                  )}
                autocompleteProps={{ fullWidth: true }}
                textFieldProps={{ margin: 'normal' }}
                matchId
                required
              />
              <Button
                variant='outlined'
                onClick={() => removePlatform(idx)}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Remove
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === 0) return;
                  swapPlatform(idx, idx - 1);
                }}
                disabled={idx === 0}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Up
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === platforms.length - 1) return;
                  swapPlatform(idx, idx + 1);
                }}
                disabled={idx === platforms.length - 1}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Down
              </Button>
            </Stack>
          ))}
          <Button
            variant='outlined'
            onClick={() => appendPlatform({ value: '' })}
            disabled={platforms.length === Object.keys(GAME_PLATFORMS).length}
            fullWidth
            sx={{ mt: 1 }}
          >
            Add Platform
          </Button>
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Characters</Typography>
          {characterIds.length === 0 && (
            <Typography color='warning.main'>
              No characters added yet.
            </Typography>
          )}
          {characterIds.map((characterId, idx) => (
            <Stack direction='row' spacing={2} key={characterId.id}>
              <AutocompleteElement
                name={`characterIds.${idx}.value`}
                label={`Character ${idx + 1}`}
                options={Object.entries(charactersCache)
                  .map(([id, { name }]) => ({ id, label: name }))
                  .filter(
                    ({ id }) =>
                      // remove characters that are already added
                      !characterIds.some((m) => m.value === id) ||
                      characterId.value === id
                  )}
                autocompleteProps={{ fullWidth: true }}
                textFieldProps={{ margin: 'normal' }}
                loading={isLoadingCharactersCache}
                matchId
                required
              />
              <Button
                variant='outlined'
                onClick={() => removeCharacter(idx)}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Remove
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === 0) return;
                  swapCharacter(idx, idx - 1);
                }}
                disabled={idx === 0}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Up
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === characterIds.length - 1) return;
                  swapCharacter(idx, idx + 1);
                }}
                disabled={idx === characterIds.length - 1}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Down
              </Button>
            </Stack>
          ))}
          <Button
            variant='outlined'
            onClick={() => appendCharacter({ value: '' })}
            disabled={
              isLoadingMusicCache ||
              characterIds.length === Object.keys(musicCache).length
            }
            fullWidth
            sx={{ mt: 1 }}
          >
            Add Character
          </Button>
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Soundtracks</Typography>
          {soundtrackIds.length === 0 && (
            <Typography color='warning.main'>
              No soundtracks added yet.
            </Typography>
          )}
          {soundtrackIds.map((soundtrackId, idx) => (
            <Stack direction='row' spacing={2} key={soundtrackId.id}>
              <AutocompleteElement
                name={`soundtrackIds.${idx}.value`}
                label={`Soundtrack ${idx + 1}`}
                options={Object.entries(musicCache)
                  .map(([id, { title, albumId }]) => {
                    const foundAlbum = musicAlbumNames[albumId];

                    const albumName =
                      albumId === ''
                        ? 'No album'
                        : foundAlbum || 'Unknown album';

                    return {
                      id,
                      label: `${title} (${albumName})`,
                    };
                  })
                  .filter(
                    ({ id }) =>
                      // remove music that are already added
                      !soundtrackIds.some((m) => m.value === id) ||
                      soundtrackId.value === id
                  )}
                autocompleteProps={{ fullWidth: true }}
                textFieldProps={{ margin: 'normal' }}
                loading={isLoadingMusicCache || isLoadingMusicAlbumNames}
                matchId
                required
              />
              <Button
                variant='outlined'
                onClick={() => removeSoundtrack(idx)}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Remove
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === 0) return;
                  swapSoundtrack(idx, idx - 1);
                }}
                disabled={idx === 0}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Up
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === soundtrackIds.length - 1) return;
                  swapSoundtrack(idx, idx + 1);
                }}
                disabled={idx === soundtrackIds.length - 1}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Down
              </Button>
            </Stack>
          ))}
          <Button
            variant='outlined'
            onClick={() => appendSoundtrack({ value: '' })}
            disabled={
              isLoadingMusicCache ||
              soundtrackIds.length === Object.keys(musicCache).length
            }
            fullWidth
            sx={{ mt: 1 }}
          >
            Add Soundtrack
          </Button>
        </Paper>
        <LoadingButton
          type='submit'
          variant='contained'
          loading={isSubmitting || isLoadingGameNames}
          fullWidth
        >
          Submit
        </LoadingButton>
      </FormContainer>
    </MainLayout>
  );
};

export default AddGame;
