import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  doc,
  getDoc,
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
import { z } from 'zod';

import { GenericHeader, MainLayout } from '~/components';
import {
  auth,
  cacheCollection,
  db,
  staffInfosCollection,
  storage,
} from '~/configs';
import { CLOUD_STORAGE_URL } from '~/constants';
import {
  GameCacheSchema,
  StaffInfoCacheSchema,
  StaffInfoSchema,
  imageSchema,
  staffInfoSchema,
} from '~/schemas';
import { revalidatePaths } from '~/utils';

const EditStaff = () => {
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
      roles: true,
      aliases: true,
    })
    .extend({
      id: z.string().nullable(),
      // doing this to fulfill useFieldArray's requirement
      // useFieldArray requires the array to be an array of objects
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

  const [lastStaffId, setLastStaffId] = useState<string | null>(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [currentStaffData, setCurrentStaffData] =
    useState<StaffInfoSchema | null>(null);

  const formContext = useForm<Schema>({
    defaultValues: {
      id: '',
      name: '',
      description: '',
      descriptionSourceName: '',
      descriptionSourceUrl: '',
      roles: [],
      games: [],
      hasAvatar: false,
      aliases: [],
      relevantLinks: [],
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    register,
    reset,
    trigger,
    setValue,
    watch,
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

  const currentId = watch('id');
  const hasAvatar = watch('hasAvatar');
  const avatar = watch('avatar');

  const changeStaff = async (id: string) => {
    try {
      setIsLoadingStaff(true);
      const staffInfoSnap = await getDoc(doc(staffInfosCollection, id));
      const staffInfo = staffInfoSnap.data();

      if (staffInfo) {
        const {
          musicIds,
          cachedMusic,
          updatedAt,
          roles,
          aliases,
          relevantLinks,
          ...rest
        } = staffInfo;

        setCurrentStaffData(staffInfo);
        reset({
          ...rest,
          id,
          roles: roles.map((role) => ({ value: role })),
          aliases: aliases ? aliases.map((value) => ({ value })) : [],
          relevantLinks: relevantLinks || [],
          avatar: null,
        });
        setLastStaffId(id);
      } else {
        setCurrentStaffData({
          name: '',
          description: '',
          descriptionSourceName: '',
          descriptionSourceUrl: '',
          roles: [],
          games: [],
          musicIds: [],
          cachedMusic: {},
          hasAvatar: false,
          updatedAt: null,
          aliases: [],
          relevantLinks: [],
        });
        reset({
          id,
          name: '',
          description: '',
          descriptionSourceName: '',
          descriptionSourceUrl: '',
          roles: [],
          games: [],
          hasAvatar: false,
          aliases: [],
          relevantLinks: [],
        });
        setLastStaffId(id);
      }
    } catch (err) {
      enqueueSnackbar('Failed to load staff.', {
        variant: 'error',
      });
      setValue('id', lastStaffId);
      console.error(err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleSave = async ({
    id,
    hasAvatar,
    avatar,
    aliases,
    ...values
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

      // upload images first to update hasAvatar
      let newHasAvatar = hasAvatar;
      if (avatar) {
        await uploadBytes(ref(storage, `staff-avatars/${id}`), avatar);
        newHasAvatar = true;
      }

      const staffInfoDocRef = doc(staffInfosCollection, id);

      const formattedRoles = values.roles.map((role) => role.value);

      const batch = writeBatch(db);

      // update staff info
      batch.update(staffInfoDocRef, {
        ...values,
        roles: formattedRoles,
        hasAvatar: newHasAvatar,
        aliases: aliases.map(({ value }) => value),
        updatedAt: serverTimestamp(),
      });

      // update staff info cache if cache fields are changed
      const newCacheData = {
        name: values.name,
        roles: formattedRoles,
        hasAvatar: newHasAvatar,
      };

      const isCacheDataChanged =
        currentStaffData?.name !== values.name ||
        JSON.stringify(currentStaffData?.roles) !==
          JSON.stringify(formattedRoles) ||
        currentStaffData?.hasAvatar !== newHasAvatar;

      if (isCacheDataChanged) {
        batch.update(doc(cacheCollection, 'staffInfo'), {
          [id]: newCacheData,
        });
      }

      await batch.commit();

      await revalidatePaths(
        [`/staff/${id}`, ...(isCacheDataChanged || !!avatar ? ['/staff'] : [])],
        tokenRes.token
      );

      setCurrentStaffData((prev) => ({
        ...prev!,
        ...values,
        roles: formattedRoles,
      }));

      setStaffInfoCache((prev) => ({
        ...prev,
        [id]: newCacheData,
      }));

      // reset images after submit
      setValue('avatar', null);
      setValue('hasAvatar', newHasAvatar);

      enqueueSnackbar('Staff updated successfully.', {
        variant: 'success',
      });
    } catch (err) {
      enqueueSnackbar('Failed to update staff.', {
        variant: 'error',
      });
      console.error(err);
    }
  };

  return (
    <MainLayout title='Edit Staff'>
      <GenericHeader title='Edit Staff' gutterBottom />
      <FormContainer
        formContext={formContext}
        handleSubmit={handleSubmit(handleSave, (err) => console.error(err))}
      >
        <Paper sx={{ px: 3, py: 2, mb: 2 }}>
          <Typography variant='h2'>Select Staff</Typography>
          <AutocompleteElement
            name='id'
            label='Staff'
            options={Object.entries(staffInfoCache).map(
              ([id, { name: label }]) => ({
                id,
                label,
              })
            )}
            loading={isLoadingStaffInfoCache}
            autocompleteProps={{
              onChange: (_, v) => changeStaff(v.id),
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
        {isLoadingStaff && <CircularProgress />}
        {!!currentId && !isLoadingStaff && (
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
                          label: releaseDate
                            ? `${name} (${releaseDate})`
                            : name,
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
                      autocompleteProps={{
                        fullWidth: true,
                        freeSolo: true,
                      }}
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
                  <Typography color='text.secondary' gutterBottom>
                    Current avatar usage:
                  </Typography>
                  <Box
                    component='img'
                    src={`${CLOUD_STORAGE_URL}/staff-avatars/${currentId}`}
                    alt='current avatar'
                    sx={{
                      width: '100%',
                      maxWidth: 150,
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      borderRadius: '50%',
                    }}
                  />
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
            {!!avatar && (
              <Alert severity='warning' sx={{ mb: 2 }}>
                Please be advised that replaced images will take up at most 60
                minutes to reflect on the page. This is due to Google Cloud
                Storage object caching.
              </Alert>
            )}
            <LoadingButton
              type='submit'
              variant='contained'
              disabled={isLoadingStaff}
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

export default EditStaff;
