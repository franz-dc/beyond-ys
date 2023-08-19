import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { deleteObject, ref, uploadBytes } from 'firebase/storage';
import { useSnackbar } from 'notistack';
import {
  AutocompleteElement,
  CheckboxElement,
  FormContainer,
  TextFieldElement,
  useFieldArray,
  useForm,
} from 'react-hook-form-mui';
import { useDebouncedCallback } from 'use-debounce';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { CharacterItem, GenericHeader, MainLayout } from '~/components';
import {
  auth,
  cacheCollection,
  charactersCollection,
  db,
  gamesCollection,
  storage,
} from '~/configs';
import { CLOUD_STORAGE_URL, LANGUAGES } from '~/constants';
import {
  CharacterCacheSchema,
  CharacterSchema,
  GameCacheSchema,
  StaffInfoCacheSchema,
  characterSchema,
  imageSchema,
} from '~/schemas';
import { revalidatePaths } from '~/utils';

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
      updatedAt: true,
    })
    .extend({
      id: z.string().nullable(),
      gameIds: z.object({ value: z.string().min(1) }).array(),
      avatar: imageSchema
        // check if less than 200x200
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
                  resolve(width <= 200 && height <= 200);
                };
              };
            });
          },
          { message: 'Avatar must not be bigger than 200x200 pixels.' }
        ),
      mainImage: imageSchema
        // check if less than 1000x1000
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
                  resolve(width <= 1000 && height <= 1000);
                };
              };
            });
          },
          { message: 'Main image must not be bigger than 1000x1000 pixels.' }
        ),
      extraImages: z
        .object({
          path: z.string().min(1),
          caption: z.string(),
          isNew: z.boolean(),
          file: imageSchema,
        })
        // check if file is present if it's a new image
        .refine(
          (value) => {
            if (!value.isNew) return true;
            return !!value.file;
          },
          { message: 'File is required.' }
        )
        .array(),
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
      accentColor: '#3c4151',
      imageDirection: 'left',
      gameIds: [],
      voiceActors: [],
      // images
      avatar: null,
      mainImage: null,
      extraImages: [],
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    register,
    trigger,
    getValues,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, errors },
    handleSubmit,
  } = formContext;

  const currentId = watch('id');
  const name = watch('name');
  const accentColor = watch('accentColor');
  // const imageDirection = watch('imageDirection');

  const avatar = watch('avatar');
  const mainImage = watch('mainImage');

  const hasAvatar = watch('hasAvatar');
  const hasMainImage = watch('hasMainImage');

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

  const {
    fields: extraImages,
    append: appendExtraImage,
    remove: removeExtraImage,
    swap: swapExtraImage,
    update: updateExtraImage,
    replace: replaceExtraImages,
  } = useFieldArray({
    control,
    name: 'extraImages',
  });

  const handleSave = async ({
    id,
    name,
    category,
    imageDirection,
    accentColor,
    gameIds,
    hasAvatar,
    hasMainImage,
    // images
    avatar,
    mainImage,
    extraImages,
    ...rest
  }: Schema) => {
    if (!id) return;
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

      // upload images first to update hasAvatar/hasMainImage
      let newHasAvatar = hasAvatar;
      if (avatar) {
        await uploadBytes(ref(storage, `character-avatars/${id}`), avatar);
        newHasAvatar = true;
      }

      let newHasMainImage = hasMainImage;
      if (mainImage) {
        await uploadBytes(ref(storage, `characters/${id}`), mainImage);
        newHasMainImage = true;
      }

      // get removed images to be deleted
      const removedExtraImages =
        currentCharacterData?.extraImages.filter(
          ({ path }) => !extraImages.some((image) => image.path === path)
        ) || [];

      // upload extra images
      const newExtraImages = extraImages.filter(({ isNew }) => isNew);
      const formattedExtraImages: CharacterSchema['extraImages'] = [];
      const newExtraImagesWithStatus: (Schema['extraImages'][number] & {
        status: 'fulfilled' | 'rejected';
      })[] = [];
      if (newExtraImages.length > 0) {
        const res = await Promise.allSettled(
          newExtraImages.map((image) =>
            uploadBytes(
              ref(storage, `character-gallery/${id}/${image.path}`),
              image.file!
            )
          )
        );

        // update extraImages - only successful uploads
        // doing it this way to preserve the order of the images
        newExtraImages.forEach((image, i) =>
          newExtraImagesWithStatus.push({
            ...image,
            status: res[i].status,
          })
        );

        extraImages.forEach(({ path, isNew, caption }) => {
          if (removedExtraImages.some((image) => image.path === path)) return;
          if (isNew) {
            const newImage = newExtraImagesWithStatus.find(
              (newImage) => newImage.path === path
            );
            if (newImage?.status !== 'fulfilled') return;
            formattedExtraImages.push({
              path,
              caption,
            });
          } else {
            formattedExtraImages.push({
              path,
              caption,
            });
          }
        });
      } else {
        extraImages.forEach(({ path, caption }) => {
          if (removedExtraImages.some((image) => image.path === path)) return;
          formattedExtraImages.push({
            path,
            caption,
          });
        });
      }

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
        hasAvatar: newHasAvatar,
        hasMainImage: newHasMainImage,
        updatedAt: serverTimestamp(),
        extraImages: formattedExtraImages,
        ...rest,
      });

      const isCacheDataChanged =
        currentCharacterData?.name !== name ||
        currentCharacterData?.category !== category ||
        currentCharacterData?.imageDirection !== imageDirection ||
        currentCharacterData?.accentColor !== accentColor ||
        currentCharacterData?.hasAvatar !== newHasAvatar;

      // update the characters cache
      if (isCacheDataChanged) {
        const newCharacterCacheData = {
          name,
          category,
          imageDirection,
          accentColor,
          hasAvatar: newHasAvatar,
        };

        // cache collection
        batch.update(doc(cacheCollection, 'characters'), {
          [id]: newCharacterCacheData,
        });

        // game collection
        currentCharacterData?.gameIds.forEach((gameId) => {
          batch.update(doc(gamesCollection, gameId), {
            [`cachedCharacters.${id}`]: newCharacterCacheData,
            updatedAt: serverTimestamp(),
          });
        });
      }

      await batch.commit();

      // delete removed images at the end to ensure they're not deleted if
      // batch fails
      if (removedExtraImages.length > 0) {
        await Promise.allSettled(
          removedExtraImages.map((image) =>
            deleteObject(ref(storage, `character-gallery/${id}/${image.path}`))
          )
        );
      }

      await revalidatePaths(
        [
          `characters/${id}`,
          ...(isCacheDataChanged || !!avatar ? ['/characters'] : []),
        ],
        tokenRes.token
      );

      // don't wait for onSnapshot to update the characterNames state
      setCharactersCache((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          name,
          category,
          imageDirection,
          accentColor,
          hasAvatar: newHasAvatar,
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

      // reset images after submit
      setValue('avatar', null);
      setValue('mainImage', null);
      setValue('hasAvatar', newHasAvatar);
      setValue('hasMainImage', newHasMainImage);
      replaceExtraImages(
        formattedExtraImages.map((image) => ({
          ...image,
          isNew: false,
          file: null,
        }))
      );

      if (
        newExtraImagesWithStatus.some(({ status }) => status === 'rejected')
      ) {
        enqueueSnackbar(
          'Some images failed to upload. All other changes were saved.',
          { variant: 'warning' }
        );
      } else {
        enqueueSnackbar('Character updated.', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar('Failed to update character.', { variant: 'error' });
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
          // images
          avatar: null,
          mainImage: null,
          extraImages: extraImages.map((image) => ({
            ...image,
            isNew: false,
            file: null,
          })),
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
          accentColor: '#3c4151',
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
          accentColor: '#3c4151',
          imageDirection: 'left',
          gameIds: [],
          voiceActors: [],
          // images
          avatar: null,
          mainImage: null,
          extraImages: [],
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

  // debounce frequently changing inputs that uses watch()
  const debounceAccentColor = useDebouncedCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue('accentColor', e.target.value);
    },
    500
  );

  const debounceName = useDebouncedCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue('name', e.target.value);
    },
    500
  );

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
              disableClearable: true,
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
              <TextField
                label='Accent Color'
                fullWidth
                margin='normal'
                type='color'
                helperText='Used in the character and game pages. Make sure it has enough contrast with white text.'
                {...register('accentColor')}
                onChange={debounceAccentColor}
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
                <Box key={voiceActor.id} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
                  <Stack direction='column' sx={{ mt: -1 }}>
                    <AutocompleteElement
                      name={`voiceActors.${idx}.staffId`}
                      label={`Voice Actor ${idx + 1}`}
                      options={Object.entries(staffInfoCache)
                        .map(([id, { name: label }]) => ({
                          id,
                          label,
                        }))
                        .filter(
                          ({ id }) =>
                            // remove voiceActors that are already selected
                            !voiceActors.some((g) => g.staffId === id) ||
                            voiceActor.staffId === id
                        )}
                      loading={isLoadingStaffInfoCache}
                      autocompleteProps={{ fullWidth: true }}
                      textFieldProps={{ margin: 'normal' }}
                      matchId
                      required
                    />
                    <AutocompleteElement
                      name={`voiceActors.${idx}.language`}
                      label={`Voice Actor ${idx + 1} Language`}
                      options={LANGUAGES}
                      autocompleteProps={{
                        fullWidth: true,
                        // freeSolo: true,
                      }}
                      textFieldProps={{
                        margin: 'normal',
                      }}
                      matchId
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
                </Box>
              ))}
              <LoadingButton
                variant='outlined'
                loading={isLoadingStaffInfoCache}
                onClick={() =>
                  appendVoiceActor({
                    staffId: '',
                    language: '',
                    description: '',
                  })
                }
                fullWidth
                disabled={
                  voiceActors.length >= Object.entries(staffInfoCache).length
                }
                sx={{ mt: 1 }}
              >
                Add Voice Actor
              </LoadingButton>
            </Paper>
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Typography variant='h2'>Avatar</Typography>
              <Typography color='text.secondary'>
                Accepted file type: .webp
              </Typography>
              <Typography color='text.secondary'>Max size: 5MB.</Typography>
              <Typography color='text.secondary'>
                Max dimensions: 200x200.
              </Typography>
              <Typography color='text.secondary' sx={{ mb: 2 }}>
                Character must be facing left or center. Face should be around
                50% image height. Transparent background is recommended.
              </Typography>
              {/* display current avatar if hasAvatar is true */}
              {hasAvatar ? (
                <Box
                  className='default-bg'
                  sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Typography color='text.secondary'>
                    Current avatar usage:
                  </Typography>
                  <Box sx={{ mt: 6 }}>
                    <CharacterItem
                      id={currentId}
                      name={name}
                      accentColor={accentColor}
                      image={`${CLOUD_STORAGE_URL}/character-avatars/${currentId}`}
                      sx={{
                        width: '100%',
                        maxWidth: 200,
                      }}
                      disableLink
                    />
                  </Box>
                </Box>
              ) : (
                <Typography color='text.secondary' sx={{ mb: 2 }}>
                  No avatar uploaded yet.
                </Typography>
              )}
              <Box>
                <Box>
                  <Box display='inline-block'>
                    <input
                      style={{ display: 'none' }}
                      id='avatar'
                      type='file'
                      accept='image/webp'
                      {...register('avatar', {
                        onChange: (e: ChangeEvent<HTMLInputElement>) => {
                          if (e.target.files?.[0].type === 'image/webp') {
                            setValue('avatar', e.target.files[0]);
                          } else {
                            setValue('avatar', null);
                            enqueueSnackbar(
                              'Invalid file type. Only .webp is accepted.',
                              { variant: 'error' }
                            );
                          }
                          trigger('avatar');
                        },
                      })}
                    />
                    <label htmlFor='avatar'>
                      <Button
                        variant='contained'
                        color={errors.avatar ? 'error' : 'primary'}
                        component='span'
                      >
                        {hasAvatar || !!avatar
                          ? 'Replace Avatar'
                          : 'Upload Avatar'}
                      </Button>
                    </label>
                  </Box>
                  {avatar && (
                    <Button
                      variant='outlined'
                      onClick={() =>
                        setValue('avatar', null, {
                          shouldValidate: true,
                        })
                      }
                      sx={{ ml: 2 }}
                    >
                      Remove Selected Avatar
                    </Button>
                  )}
                </Box>
                {/* display selected image */}
                {avatar && (
                  <Box sx={{ mt: 2 }}>
                    {errors.avatar && (
                      <Typography color='error.main' sx={{ mb: 2 }}>
                        {/* @ts-ignore .any() will be checked on .refine() */}
                        {errors.avatar.message}
                      </Typography>
                    )}
                    <Box
                      className='default-bg'
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      <Typography color='text.secondary'>
                        Selected image usage:
                      </Typography>
                      <Box sx={{ mt: 6 }}>
                        <CharacterItem
                          id={currentId}
                          name={name}
                          accentColor={accentColor}
                          image={URL.createObjectURL(avatar)}
                          sx={{
                            width: '100%',
                            maxWidth: 200,
                          }}
                          disableLink
                        />
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Typography variant='h2'>Main Image</Typography>
              <Typography color='text.secondary'>
                Accepted file type: .webp
              </Typography>
              <Typography color='text.secondary'>Max size: 5MB.</Typography>
              <Typography color='text.secondary'>
                Max dimensions: 1000x1000.
              </Typography>
              <Typography color='text.secondary' sx={{ mb: 1 }}>
                Transparent background is recommended.
              </Typography>
              <AutocompleteElement
                name='imageDirection'
                label='Image Direction'
                options={[
                  { id: 'left', label: 'Left' },
                  { id: 'right', label: 'Right' },
                ]}
                autocompleteProps={{ fullWidth: true, disableClearable: true }}
                textFieldProps={{
                  margin: 'normal',
                  helperText:
                    'Used to make main images face right on the character page.',
                }}
                matchId
                required
              />
              {/* display main image if hasMainImage is true */}
              {hasMainImage ? (
                <Box
                  className='default-bg'
                  sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Typography color='text.secondary' sx={{ mb: 1 }}>
                    Current main image:
                  </Typography>
                  <Box
                    component='img'
                    src={`${CLOUD_STORAGE_URL}/characters/${currentId}`}
                    alt='current main image'
                    sx={{
                      width: '100%',
                      height: 'auto',
                      maxWidth: 180,
                      // transform: `scaleX(${
                      //   imageDirection === 'left' ? 1 : -1
                      // })`,
                    }}
                  />
                </Box>
              ) : (
                <Typography color='text.secondary' sx={{ mb: 2 }}>
                  No main image uploaded yet.
                </Typography>
              )}
              <Box>
                <Box>
                  <Box display='inline-block'>
                    <input
                      style={{ display: 'none' }}
                      id='mainImage'
                      type='file'
                      accept='image/webp'
                      {...register('mainImage', {
                        onChange: (e: ChangeEvent<HTMLInputElement>) => {
                          if (e.target.files?.[0].type === 'image/webp') {
                            setValue('mainImage', e.target.files[0]);
                          } else {
                            setValue('mainImage', null);
                            enqueueSnackbar(
                              'Invalid file type. Only .webp is accepted.',
                              { variant: 'error' }
                            );
                          }
                          trigger('mainImage');
                        },
                      })}
                    />
                    <label htmlFor='mainImage'>
                      <Button
                        variant='contained'
                        color={errors.mainImage ? 'error' : 'primary'}
                        component='span'
                      >
                        {hasMainImage || !!mainImage
                          ? 'Replace Main Image'
                          : 'Upload Main Image'}
                      </Button>
                    </label>
                  </Box>
                  {mainImage && (
                    <Button
                      variant='outlined'
                      onClick={() =>
                        setValue('mainImage', null, {
                          shouldValidate: true,
                        })
                      }
                      sx={{ ml: 2 }}
                    >
                      Remove Selected Main Image
                    </Button>
                  )}
                </Box>
                {/* display selected image */}
                {mainImage && (
                  <Box sx={{ mt: 2 }}>
                    {errors.mainImage && (
                      <Typography color='error.main' sx={{ mb: 2 }}>
                        {errors.mainImage.message}
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
                        Selected main image:
                      </Typography>
                      <Box
                        component='img'
                        src={URL.createObjectURL(mainImage)}
                        alt='selected main image'
                        sx={{
                          width: '100%',
                          height: 'auto',
                          maxWidth: 180,
                          // transform: `scaleX(${
                          //   imageDirection === 'left' ? 1 : -1
                          // })`,
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
            <Paper sx={{ px: 3, py: 2, mb: 2 }}>
              <Typography variant='h2'>Character Gallery</Typography>
              <Typography color='text.secondary'>
                Accepted file type: .webp
              </Typography>
              <Typography color='text.secondary' sx={{ mb: 2 }}>
                Max size: 5MB.
              </Typography>
              {extraImages.length === 0 && (
                <Typography color='warning.main'>
                  No images uploaded yet.
                </Typography>
              )}
              {extraImages.map((extraImage, idx) => (
                <Box key={extraImage.id} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
                  <Stack direction='row' sx={{ mb: 2 }}>
                    <Typography
                      component='p'
                      variant='h3'
                      sx={{ mb: 0.5, mr: 1 }}
                    >
                      Extra Image {idx + 1}
                    </Typography>
                    {extraImage.isNew ? (
                      <Chip
                        variant='outlined'
                        color='success'
                        size='small'
                        label='New'
                      />
                    ) : (
                      <Chip variant='outlined' size='small' label='Existing' />
                    )}
                  </Stack>
                  {(!extraImage.isNew || !!extraImage.file) && (
                    <Box
                      component='img'
                      src={
                        extraImage.isNew
                          ? URL.createObjectURL(extraImage.file!)
                          : `${CLOUD_STORAGE_URL}/character-gallery/${currentId}/${extraImage.path}`
                      }
                      alt={`Extra Image ${idx + 1}`}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        maxWidth: 180,
                        mb: 2,
                        // hide alt text on firefox
                        color: 'transparent',
                      }}
                    />
                  )}
                  {extraImage.isNew && (
                    <Box>
                      <input
                        style={{ display: 'none' }}
                        id={`extraImages.${idx}.file`}
                        type='file'
                        accept='image/webp'
                        {...register(`extraImages.${idx}.file`, {
                          onChange: (e: ChangeEvent<HTMLInputElement>) => {
                            // doing this because useFieldArray's fields does
                            // not always have the latest value
                            const prevExtraImage = getValues(
                              `extraImages.${idx}`
                            );
                            if (e.target.files?.[0].type === 'image/webp') {
                              updateExtraImage(idx, {
                                ...prevExtraImage,
                                file: e.target.files[0],
                              });
                            } else {
                              updateExtraImage(idx, {
                                ...prevExtraImage,
                                file: null,
                              });
                              enqueueSnackbar(
                                'Invalid file type. Only .webp is accepted.',
                                { variant: 'error' }
                              );
                            }
                            trigger(`extraImages.${idx}.file`);
                          },
                        })}
                      />
                      <label htmlFor={`extraImages.${idx}.file`}>
                        <Button
                          variant='contained'
                          color={errors.mainImage ? 'error' : 'primary'}
                          component='span'
                        >
                          {!!extraImages[idx].file
                            ? 'Replace Image'
                            : 'Upload Image'}
                        </Button>
                      </label>
                    </Box>
                  )}
                  <TextFieldElement
                    name={`extraImages.${idx}.caption`}
                    label='Caption'
                    fullWidth
                    margin='normal'
                  />
                  <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
                    <Button
                      variant='outlined'
                      onClick={() => removeExtraImage(idx)}
                      fullWidth
                    >
                      Remove
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        if (idx === 0) return;
                        swapExtraImage(idx, idx - 1);
                      }}
                      disabled={idx === 0}
                      fullWidth
                    >
                      Up
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        if (idx === extraImages.length - 1) return;
                        swapExtraImage(idx, idx + 1);
                      }}
                      disabled={idx === extraImages.length - 1}
                      fullWidth
                    >
                      Down
                    </Button>
                  </Stack>
                </Box>
              ))}
              <Button
                variant='outlined'
                onClick={() =>
                  appendExtraImage({
                    // make sure the path is unique
                    path: (() => {
                      let path = '';
                      do {
                        path = uuidv4();
                      } while (
                        extraImages.some((image) => image.path === path)
                      );
                      return path;
                    })(),
                    caption: '',
                    isNew: true,
                    file: null,
                  })
                }
                fullWidth
                sx={{ mt: 1 }}
              >
                Add Image
              </Button>
            </Paper>
            {(!!avatar || !!mainImage) && (
              <Alert severity='warning' sx={{ mb: 2 }}>
                Please be advised that replaced images will take up at most 60
                minutes to reflect on the page. This is due to Google Cloud
                Storage object caching.
              </Alert>
            )}
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
