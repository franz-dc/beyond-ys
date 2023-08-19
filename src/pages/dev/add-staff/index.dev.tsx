import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { useSnackbar } from 'notistack';
import {
  AutocompleteElement,
  FormContainer,
  TextFieldElement,
  useFieldArray,
  useForm,
} from 'react-hook-form-mui';
import slugify from 'slugify';
import { useDebouncedCallback } from 'use-debounce';
import { z } from 'zod';

import { GenericHeader, MainLayout, SwitchElement } from '~/components';
import {
  auth,
  cacheCollection,
  db,
  staffInfosCollection,
  storage,
} from '~/configs';
import {
  GameCacheSchema,
  StaffInfoCacheSchema,
  imageSchema,
  staffInfoSchema,
} from '~/schemas';
import { revalidatePaths } from '~/utils';

const AddStaff = () => {
  const { enqueueSnackbar } = useSnackbar();

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

  const schema = staffInfoSchema
    .omit({
      cachedMusic: true,
      musicIds: true,
      updatedAt: true,
      hasAvatar: true,
      // doing this to fulfill useFieldArray's requirement
      roles: true,
      aliases: true,
    })
    .extend({
      id: z
        .string()
        .min(1)
        .refine((id) => !staffInfoCache[id], {
          message: 'Slug is already taken.',
        }),
      name: z.string().min(1),
      customSlug: z.boolean(),
      roles: z
        .object({
          value: z.string(),
        })
        .array(),
      aliases: z.object({ value: z.string().min(1) }).array(),
      avatar: imageSchema
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
          { message: 'Avatar must not be bigger than 500x500 pixels.' }
        ),
    });

  type Schema = z.infer<typeof schema> & {
    id: string | null;
  };

  const formContext = useForm<Schema>({
    defaultValues: {
      id: '',
      customSlug: false,
      name: '',
      description: '',
      descriptionSourceName: '',
      descriptionSourceUrl: '',
      roles: [],
      games: [],
      avatar: null,
      aliases: [],
      relevantLinks: [],
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    register,
    watch,
    trigger,
    getValues,
    setValue,
    reset,
    formState: { isSubmitting, errors },
    handleSubmit,
  } = formContext;

  const {
    fields: roles,
    append: appendRole,
    remove: removeRole,
    swap: swapRole,
  } = useFieldArray({
    control,
    name: 'roles',
  });

  const {
    fields: games,
    append: appendGame,
    remove: removeGame,
    swap: swapGame,
  } = useFieldArray({
    control,
    name: 'games',
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

  const {
    fields: relevantLinks,
    append: appendRelevantLink,
    remove: removeRelevantLink,
    swap: swapRelevantLink,
  } = useFieldArray({
    control,
    name: 'relevantLinks',
  });

  const handleSave = async ({
    id,
    name,
    roles,
    avatar,
    aliases,
    ...rest
  }: Schema) => {
    // check if id is already taken (using the staffInfo cache)
    // failsafe in case the user somehow bypasses the form validation
    if (staffInfoCache[id]) {
      throw new Error(`Slug '${id}' is already taken.`);
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

      // upload images first to update hasAvatar
      let hasAvatar = false;
      if (avatar) {
        await uploadBytes(ref(storage, `staff-avatars/${id}`), avatar);
        hasAvatar = true;
      }

      const staffInfoDocRef = doc(staffInfosCollection, id);

      const formattedRoles = roles.map(({ value }) => value);

      const batch = writeBatch(db);

      // create the staff info doc and fill the rest with blank data
      batch.set(staffInfoDocRef, {
        name,
        roles: formattedRoles,
        updatedAt: serverTimestamp(),
        cachedMusic: {},
        musicIds: [],
        hasAvatar,
        aliases: aliases.map(({ value }) => value),
        ...rest,
      });

      const newCacheData = {
        name,
        roles: formattedRoles,
        hasAvatar,
      };

      // update the staffInfo cache
      batch.update(doc(cacheCollection, 'staffInfo'), {
        [id]: newCacheData,
      });

      await batch.commit();

      await revalidatePaths([`/staff/${id}`, '/staff'], tokenRes.token);

      // don't wait for onSnapshot to update the staffInfoCache state
      setStaffInfoCache((prev) => ({ ...prev, [id]: newCacheData }));

      reset();

      enqueueSnackbar('Staff member added.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to add staff member.', { variant: 'error' });
      console.error(err);
    }
  };

  const customSlug = watch('customSlug');
  const avatar = watch('avatar');

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
    <MainLayout title='Add Staff'>
      <GenericHeader title='Add Staff' gutterBottom />
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
          <Typography variant='h2'>Roles</Typography>
          {roles.map((role, idx) => (
            <Stack direction='row' spacing={2} key={role.id}>
              <TextFieldElement
                name={`roles.${idx}.value`}
                label={`Role ${idx + 1}`}
                fullWidth
                margin='normal'
                required
              />
              <Button
                variant='outlined'
                onClick={() => removeRole(idx)}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Remove
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === 0) return;
                  swapRole(idx, idx - 1);
                }}
                disabled={idx === 0}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Up
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (idx === roles.length - 1) return;
                  swapRole(idx, idx + 1);
                }}
                disabled={idx === roles.length - 1}
                sx={{ mt: '16px !important', height: 56 }}
              >
                Down
              </Button>
            </Stack>
          ))}
          <Button
            variant='outlined'
            onClick={() => appendRole({ value: '' })}
            fullWidth
            sx={{ mt: 1 }}
          >
            Add Role
          </Button>
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2' sx={{ mb: 2 }}>
            Game Involvements
          </Typography>
          {games.map((game, idx) => (
            <Box
              key={game.id}
              className='default-bg'
              sx={{ mb: 2, p: 2, borderRadius: 2 }}
            >
              <Stack direction='column' sx={{ mt: -1 }}>
                <AutocompleteElement
                  name={`games.${idx}.gameId`}
                  label={`Game ${idx + 1}`}
                  options={Object.entries(cachedGames)
                    .map(([id, { name, releaseDate }]) => ({
                      id,
                      label: releaseDate ? `${name} (${releaseDate})` : name,
                    }))
                    .filter(
                      ({ id }) =>
                        // remove games that are already selected
                        !games.some((g) => g.gameId === id) ||
                        game.gameId === id
                    )}
                  loading={isLoadingCachedGames}
                  autocompleteProps={{ fullWidth: true }}
                  textFieldProps={{ margin: 'normal' }}
                  matchId
                  required
                />
                <AutocompleteElement
                  name={`games.${idx}.roles`}
                  label={`Game ${idx + 1} Roles`}
                  options={[
                    'Arranger',
                    'Composer',
                    'Coordinator',
                    'Director',
                    'Graphic Artist',
                    'Illustrator',
                    'Producer',
                    'Programmer',
                    'Public Relations',
                    'Scenario Writer',
                    'Supervisor',
                    'Voice Actor',
                  ]}
                  multiple
                  autocompleteProps={{ fullWidth: true, freeSolo: true }}
                  textFieldProps={{
                    margin: 'normal',
                    helperText: 'Press enter to add a new role',
                  }}
                  required
                />
                <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
                  <Button
                    variant='outlined'
                    onClick={() => removeGame(idx)}
                    fullWidth
                  >
                    Remove
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={() => {
                      if (idx === 0) return;
                      swapGame(idx, idx - 1);
                    }}
                    disabled={idx === 0}
                    fullWidth
                  >
                    Up
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={() => {
                      if (idx === games.length - 1) return;
                      swapGame(idx, idx + 1);
                    }}
                    disabled={idx === games.length - 1}
                    fullWidth
                  >
                    Down
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ))}
          <Button
            variant='outlined'
            onClick={() => appendGame({ gameId: '', roles: [] })}
            fullWidth
            disabled={games.length >= Object.keys(cachedGames).length}
          >
            Add Game
          </Button>
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2' sx={{ mb: 2 }}>
            Relevant Links
          </Typography>
          {relevantLinks.map((relevantLink, idx) => (
            <Box
              key={relevantLink.id}
              className='default-bg'
              sx={{ mb: 2, p: 2, borderRadius: 2 }}
            >
              <Stack direction='column' sx={{ mt: -1 }}>
                <TextFieldElement
                  name={`relevantLinks.${idx}.name`}
                  label={`Name ${idx + 1}`}
                  fullWidth
                  margin='normal'
                  required
                />
                <TextFieldElement
                  name={`relevantLinks.${idx}.url`}
                  label={`URL ${idx + 1}`}
                  fullWidth
                  margin='normal'
                  required
                />
                <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
                  <Button
                    variant='outlined'
                    onClick={() => removeRelevantLink(idx)}
                    fullWidth
                  >
                    Remove
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={() => {
                      if (idx === 0) return;
                      swapRelevantLink(idx, idx - 1);
                    }}
                    disabled={idx === 0}
                    fullWidth
                  >
                    Up
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={() => {
                      if (idx === relevantLinks.length - 1) return;
                      swapRelevantLink(idx, idx + 1);
                    }}
                    disabled={idx === relevantLinks.length - 1}
                    fullWidth
                  >
                    Down
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ))}
          <Button
            variant='outlined'
            onClick={() =>
              appendRelevantLink({
                name: '',
                url: '',
              })
            }
            fullWidth
          >
            Add Relevant Link
          </Button>
        </Paper>
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Avatar</Typography>
          <Typography color='text.secondary'>
            Accepted file type: .webp
          </Typography>
          <Typography color='text.secondary'>Max size: 5MB.</Typography>
          <Typography color='text.secondary' sx={{ mb: 2 }}>
            Max dimensions: 500x500.
          </Typography>
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
                    {!!avatar ? 'Replace Avatar' : 'Upload Avatar'}
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
                  <Typography color='text.secondary' gutterBottom>
                    Selected avatar usage:
                  </Typography>
                  <Box
                    component='img'
                    src={URL.createObjectURL(avatar)}
                    alt='selected avatar'
                    sx={{
                      width: '100%',
                      maxWidth: 150,
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      borderRadius: '50%',
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
        <LoadingButton
          type='submit'
          variant='contained'
          loading={isSubmitting || isLoadingStaffInfoCache}
          fullWidth
        >
          Submit
        </LoadingButton>
      </FormContainer>
    </MainLayout>
  );
};

export default AddStaff;
