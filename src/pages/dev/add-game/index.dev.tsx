import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
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
import slugify from 'slugify';
import { useDebouncedCallback } from 'use-debounce';
import { z } from 'zod';

import {
  DatePickerElement,
  GenericHeader,
  MainLayout,
  SwitchElement,
} from '~/components';
import {
  auth,
  cacheCollection,
  charactersCollection,
  db,
  gamesCollection,
  musicCollection,
  storage,
} from '~/configs';
import { GAME_PLATFORMS } from '~/constants';
import {
  CharacterCacheSchema,
  MusicAlbumCacheSchema,
  MusicCacheSchema,
  MusicSchema,
  gameSchema,
  imageSchema,
} from '~/schemas';
import { formatISO, revalidatePaths } from '~/utils';

const AddGame = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [cachedGames, setCachedGames] = useState<Record<string, string>>({});
  const [isLoadingCachedGames, setIsLoadingCachedGames] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(cacheCollection, 'games'), (docSnap) => {
      setCachedGames(docSnap.data() || {});
      setIsLoadingCachedGames(false);
    });

    return () => unsubscribe();
  }, []);

  const [cachedMusicAlbums, setCachedMusicAlbums] = useState<
    Record<string, MusicAlbumCacheSchema>
  >({});
  const [isLoadingCachedMusicAlbums, setIsLoadingCachedMusicAlbums] =
    useState(true);

  // doing this in case someone else added an album while the user is
  // filling this form. this will update the validation in real time
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
      cachedCharacters: true,
      dependentCharacterIds: true,
      hasCoverImage: true,
      hasBannerImage: true,
      // conform to useFieldArray's format
      platforms: true,
      characterIds: true,
      soundtrackIds: true,
      aliases: true,
    })
    .extend({
      id: z
        .string()
        .min(1)
        .refine((value) => !cachedGames[value], {
          message: 'Slug is already taken.',
        })
        .refine(
          (value) => {
            // regex to check if the slug is valid: lowercase letters, numbers, dashes
            const regex = /^[a-z0-9-]+$/;
            return regex.test(value);
          },
          {
            message:
              'Slug can only contain lowercase letters, numbers, and dashes.',
          }
        ),
      customSlug: z.boolean(),
      platforms: z.object({ value: z.string().min(1) }).array(),
      characterIds: z.object({ value: z.string().min(1) }).array(),
      soundtrackIds: z.object({ value: z.string().min(1) }).array(),
      aliases: z.object({ value: z.string().min(1) }).array(),
      releaseDatePrecision: z.string().min(1),
      coverImage: imageSchema
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
          { message: 'Cover must not be bigger than 500x500 pixels.' }
        ),
      bannerImage: imageSchema
        // check if less than 2000x2000
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
                  resolve(width <= 2000 && height <= 2000);
                };
              };
            });
          },
          { message: 'Banner must not be bigger than 2000x2000 pixels.' }
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
      releaseDatePrecision: '',
      description: '',
      descriptionSourceName: '',
      descriptionSourceUrl: '',
      characterIds: [],
      characterSpoilerIds: [],
      soundtrackIds: [],
      coverImage: null,
      bannerImage: null,
      aliases: [],
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    register,
    reset,
    trigger,
    getValues,
    watch,
    setValue,
    formState: { isSubmitting, errors },
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

  const {
    fields: aliases,
    append: appendAlias,
    remove: removeAlias,
    swap: swapAlias,
  } = useFieldArray({
    control,
    name: 'aliases',
  });

  const handleSave = async ({
    id,
    name,
    category,
    subcategory,
    platforms,
    releaseDate,
    releaseDatePrecision,
    description,
    descriptionSourceName,
    descriptionSourceUrl,
    characterIds,
    characterSpoilerIds,
    soundtrackIds,
    coverImage,
    bannerImage,
    aliases,
  }: Schema) => {
    // check if id is already taken (using the games cache)
    // failsafe in case the user somehow bypasses the form validation
    if (cachedGames[id]) {
      enqueueSnackbar(`Slug '${id}' is already taken.`, {
        variant: 'error',
      });
      return;
    }
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

      // upload images first to update hasCoverImage and hasBannerImage
      let hasCoverImage = false;
      if (coverImage) {
        await uploadBytes(ref(storage, `game-covers/${id}`), coverImage);
        hasCoverImage = true;
      }

      let hasBannerImage = false;
      if (bannerImage) {
        await uploadBytes(ref(storage, `game-banners/${id}`), bannerImage);
        hasBannerImage = true;
      }

      const batch = writeBatch(db);

      const formattedSoundtrackIds = soundtrackIds.map(({ value }) => value);
      const formattedCharacterIds = characterIds.map(({ value }) => value);

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

      // get all the soundtrack docs
      const cachedSoundtracks: Record<string, MusicSchema> = {};

      if (formattedSoundtrackIds.length > 0) {
        // split the formattedSoundtrackIds into chunks of 30
        // due to 'in' query limit
        const formattedSoundtrackIdsChunks = formattedSoundtrackIds.reduce(
          (acc, curr) => {
            const last = acc[acc.length - 1];
            if (last.length < 30) {
              last.push(curr);
            } else {
              acc.push([curr]);
            }
            return acc;
          },
          [[]] as string[][]
        );

        const newSoundtracksQuerySnap = await Promise.all(
          formattedSoundtrackIdsChunks.map((chunk) =>
            getDocs(query(musicCollection, where(documentId(), 'in', chunk)))
          )
        );

        newSoundtracksQuerySnap.forEach((querySnap) => {
          querySnap.forEach((docSnap) => {
            if (!docSnap.exists()) return;
            cachedSoundtracks[docSnap.id] = {
              ...docSnap.data(),
              dependentGameIds: [...docSnap.data().dependentGameIds, id],
            };
          });
        });
      }

      // get all characterCache from characterIds
      const cachedCharacters = formattedCharacterIds.reduce<
        Record<string, CharacterCacheSchema>
      >((acc, characterId) => {
        const cachedCharacter = charactersCache[characterId];
        if (cachedCharacter) {
          acc[characterId] = cachedCharacter;
        }
        return acc;
      }, {});

      const newData = {
        name,
        category,
        subcategory,
        platforms: platforms.map(({ value }) => value),
        releaseDate: formattedReleaseDate,
        description,
        descriptionSourceName,
        descriptionSourceUrl,
        characterIds: characterIds.map(({ value }) => value),
        characterSpoilerIds,
        soundtrackIds: formattedSoundtrackIds,
        updatedAt: serverTimestamp(),
        cachedSoundtracks,
        cachedCharacters,
        hasCoverImage,
        hasBannerImage,
        aliases: aliases.map(({ value }) => value),
      };

      // update the game doc
      batch.set(doc(gamesCollection, id), newData);

      const gameCacheData = {
        name,
        category,
        releaseDate: formattedReleaseDate,
        hasCoverImage,
      };

      // update the games cache
      batch.update(doc(cacheCollection, 'games'), {
        [id]: gameCacheData,
      });

      // update music docs
      formattedSoundtrackIds.forEach((soundtrackId) => {
        batch.update(doc(musicCollection, soundtrackId), {
          dependentGameIds: arrayUnion(id),
          updatedAt: serverTimestamp(),
        });
      });

      // update gameId from character docs
      formattedCharacterIds.forEach((characterId) => {
        batch.update(doc(charactersCollection, characterId), {
          gameIds: arrayUnion(id),
          [`cachedGames.${id}`]: gameCacheData,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      await revalidatePaths(
        [
          `/games/${id}`,
          '/games',
          ...(['Ys Series', 'Ys / Trails Series'].includes(category)
            ? ['/ys-series']
            : []),
          ...(['Trails Series', 'Ys / Trails Series'].includes(category)
            ? ['/trails-series']
            : []),
          ...(category === 'Gagharv Trilogy' ? ['/gagharv-trilogy'] : []),
          ...formattedCharacterIds.map((id) => `/characters/${id}`),
        ],
        tokenRes.token
      );

      reset();

      enqueueSnackbar('Game added successfully.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to add game.', { variant: 'error' });
      console.error(err);
    }
  };

  const customSlug = watch('customSlug');
  const characterSpoilerIds = watch('characterSpoilerIds');
  const coverImage = watch('coverImage');
  const bannerImage = watch('bannerImage');

  const debounceName = useDebouncedCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue('name', e.target.value);
      if (customSlug) return;
      const name = e.target.value;
      const id = slugify(name, {
        lower: true,
        remove: /[*+~.,()'"!:@/]/g,
      });

      setValue('id', id, { shouldValidate: true });
    },
    500
  );

  return (
    <MainLayout title='Add Game'>
      <GenericHeader title='Add Game' gutterBottom />
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
                  remove: /[*+~.,()'"!:@/]/g,
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
          <TextField
            label='Name'
            required
            fullWidth
            margin='normal'
            {...register('name')}
            onChange={debounceName}
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
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Aliases</Typography>
          {aliases.map((role, idx) => (
            <Stack direction='row' spacing={2} key={role.id}>
              <TextFieldElement
                name={`aliases.${idx}.value`}
                label={`Alias ${idx + 1}`}
                fullWidth
                margin='normal'
                required
              />
              <Button
                variant='outlined'
                onClick={() => removeAlias(idx)}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Remove
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === 0) return;
                  swapAlias(idx, idx - 1);
                }}
                disabled={idx === 0}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Up
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === aliases.length - 1) return;
                  swapAlias(idx, idx + 1);
                }}
                disabled={idx === aliases.length - 1}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Down
              </Button>
            </Stack>
          ))}
          <Button
            variant='outlined'
            onClick={() => appendAlias({ value: '' })}
            fullWidth
            sx={{ mt: 1 }}
          >
            Add Alias
          </Button>
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
            disabled={platforms.length >= Object.keys(GAME_PLATFORMS).length}
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={characterSpoilerIds.includes(
                      getValues(`characterIds.${idx}.value`)
                    )}
                    edge='start'
                    onChange={(e) => {
                      // useFieldArray's fields doesn't update immediately
                      const currentCharacterId = getValues(
                        `characterIds.${idx}.value`
                      );
                      if (!currentCharacterId) return;
                      const prevCharacterSpoilerIds = getValues(
                        'characterSpoilerIds'
                      );
                      if (e.target.checked) {
                        setValue('characterSpoilerIds', [
                          ...prevCharacterSpoilerIds,
                          currentCharacterId,
                        ]);
                      } else {
                        setValue(
                          'characterSpoilerIds',
                          prevCharacterSpoilerIds.filter(
                            (id) => id !== currentCharacterId
                          )
                        );
                      }
                    }}
                  />
                }
                label='Spoiler'
                sx={{
                  mt: '16px !important',
                  height: 56,
                }}
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
              characterIds.length === Object.keys(charactersCache).length
            }
            fullWidth
            sx={{ mt: 1 }}
          >
            Add Character
          </Button>
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Cover Image</Typography>
          <Typography color='text.secondary'>
            Accepted file type: .webp
          </Typography>
          <Typography color='text.secondary'>Max size: 5MB.</Typography>
          <Typography color='text.secondary'>
            Max dimensions: 500x500.
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 2 }}>
            Note that cover images are cropped to 2:3 aspect ratio.
          </Typography>
          <Box>
            <Box>
              <Box display='inline-block'>
                <input
                  style={{ display: 'none' }}
                  id='coverImage'
                  type='file'
                  accept='image/webp'
                  {...register('coverImage', {
                    onChange: (e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files?.[0].type === 'image/webp') {
                        setValue('coverImage', e.target.files[0]);
                      } else {
                        setValue('coverImage', null);
                        enqueueSnackbar(
                          'Invalid file type. Only .webp is accepted.',
                          { variant: 'error' }
                        );
                      }
                      trigger('coverImage');
                    },
                  })}
                />
                <label htmlFor='coverImage'>
                  <Button
                    variant='contained'
                    color={errors.coverImage ? 'error' : 'primary'}
                    component='span'
                  >
                    {!!coverImage
                      ? 'Replace Cover Image'
                      : 'Upload Cover Image'}
                  </Button>
                </label>
              </Box>
              {coverImage && (
                <Button
                  variant='outlined'
                  onClick={() =>
                    setValue('coverImage', null, {
                      shouldValidate: true,
                    })
                  }
                  sx={{ ml: 2 }}
                >
                  Remove Selected Cover Image
                </Button>
              )}
            </Box>
            {/* display selected image */}
            {coverImage && (
              <Box sx={{ mt: 2 }}>
                {errors.coverImage && (
                  <Typography color='error.main' sx={{ mb: 2 }}>
                    {errors.coverImage.message}
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
                    Selected cover image (cropped):
                  </Typography>
                  <Box
                    component='img'
                    src={URL.createObjectURL(coverImage)}
                    alt='selected cover image'
                    sx={{
                      width: '100%',
                      maxWidth: 180,
                      aspectRatio: '2 / 3',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Banner Image</Typography>
          <Typography color='text.secondary'>
            Accepted file type: .webp
          </Typography>
          <Typography color='text.secondary'>Max size: 5MB.</Typography>
          <Typography color='text.secondary'>
            Max dimensions: 2000x2000.
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 2 }}>
            Note that banner images are cropped to 100% width to 120-200px
            height ratio.
          </Typography>
          <Box>
            <Box>
              <Box display='inline-block'>
                <input
                  style={{ display: 'none' }}
                  id='bannerImage'
                  type='file'
                  accept='image/webp'
                  {...register('bannerImage', {
                    onChange: (e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files?.[0].type === 'image/webp') {
                        setValue('bannerImage', e.target.files[0]);
                      } else {
                        setValue('bannerImage', null);
                        enqueueSnackbar(
                          'Invalid file type. Only .webp is accepted.',
                          { variant: 'error' }
                        );
                      }
                      trigger('bannerImage');
                    },
                  })}
                />
                <label htmlFor='bannerImage'>
                  <Button
                    variant='contained'
                    color={errors.bannerImage ? 'error' : 'primary'}
                    component='span'
                  >
                    {!!bannerImage
                      ? 'Replace Banner Image'
                      : 'Upload Banner Image'}
                  </Button>
                </label>
              </Box>
              {bannerImage && (
                <Button
                  variant='outlined'
                  onClick={() =>
                    setValue('bannerImage', null, {
                      shouldValidate: true,
                    })
                  }
                  sx={{ ml: 2 }}
                >
                  Remove Selected Banner Image
                </Button>
              )}
            </Box>
            {/* display selected image */}
            {bannerImage && (
              <Box sx={{ mt: 2 }}>
                {errors.bannerImage && (
                  <Typography color='error.main' sx={{ mb: 2 }}>
                    {errors.bannerImage.message}
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
                    Selected banner image (cropped):
                  </Typography>
                  <Box
                    component='img'
                    src={URL.createObjectURL(bannerImage)}
                    alt='selected banner image'
                    sx={{
                      width: '100%',
                      height: {
                        xs: 120,
                        sm: 160,
                        md: 200,
                      },
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
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
                    const foundAlbum = cachedMusicAlbums[albumId];

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
                      !soundtrackIds.some((m) => m.value === id) ||
                      soundtrackId.value === id
                  )}
                autocompleteProps={{ fullWidth: true }}
                textFieldProps={{ margin: 'normal' }}
                loading={isLoadingMusicCache || isLoadingCachedMusicAlbums}
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
              soundtrackIds.length >= Object.keys(musicCache).length
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
          loading={isSubmitting || isLoadingCachedGames}
          fullWidth
        >
          Submit
        </LoadingButton>
      </FormContainer>
    </MainLayout>
  );
};

export default AddGame;
