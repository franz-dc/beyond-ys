import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { GetServerSideProps } from 'next';
import { useSnackbar } from 'notistack';
import {
  AutocompleteElement,
  FormContainer,
  SelectElement,
  TextFieldElement,
  useFieldArray,
  useForm,
} from 'react-hook-form-mui';
import { z } from 'zod';

import { GenericHeader, MainLayout } from '~/components';
import { cacheCollection, db, staffInfosCollection } from '~/configs';
import { StaffInfoSchema, staffInfoSchema } from '~/schemas';

interface EditStaffProps {
  initialStaffNames: Record<string, string>;
  gameNames: Record<string, string>;
}

export const getServerSideProps: GetServerSideProps<
  EditStaffProps
> = async () => {
  const staffNamesDocSnap = await getDoc(doc(cacheCollection, 'staffNames'));
  const gameNamesDocSnap = await getDoc(doc(cacheCollection, 'gameNames'));

  return {
    props: {
      initialStaffNames: staffNamesDocSnap.data() || {},
      gameNames: gameNamesDocSnap.data() || {},
    },
  };
};

const EditStaff = ({ initialStaffNames, gameNames }: EditStaffProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const schema = staffInfoSchema
    .omit({
      cachedMusic: true,
      updatedAt: true,
      roles: true,
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
    });

  type Schema = z.infer<typeof schema> & {
    id: string | null;
  };

  const [staffNames, setStaffNames] = useState(initialStaffNames);

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
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
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

  const currentId = watch('id');

  const changeStaff = async (id: string) => {
    try {
      setIsLoadingStaff(true);
      const staffInfoSnap = await getDoc(doc(staffInfosCollection, id));
      const staffInfo = staffInfoSnap.data();

      if (staffInfo) {
        const { cachedMusic, updatedAt, roles, ...rest } = staffInfo;

        setCurrentStaffData(staffInfo);
        reset({
          ...rest,
          id,
          roles: roles.map((role) => ({ value: role })),
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
          cachedMusic: [],
          updatedAt: null,
        });
        reset({
          id,
          name: '',
          description: '',
          descriptionSourceName: '',
          descriptionSourceUrl: '',
          roles: [],
          games: [],
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

  const handleSave = async ({ id, ...values }: Schema) => {
    if (!id) return;
    try {
      const staffInfoDocRef = doc(staffInfosCollection, id);

      const batch = writeBatch(db);

      // update staff info
      batch.update(staffInfoDocRef, {
        ...values,
        roles: values.roles.map((role) => role.value),
        updatedAt: serverTimestamp(),
      });

      // update staff names cache if name is changed
      if (currentStaffData?.name !== values.name) {
        const staffNamesDocRef = doc(cacheCollection, 'staffNames');

        batch.update(staffNamesDocRef, {
          [id]: values.name,
        });
      }

      // update staff roles cache if roles are changed
      if (
        JSON.stringify(currentStaffData?.roles) !== JSON.stringify(values.roles)
      ) {
        const StaffRolesDocRef = doc(cacheCollection, 'staffRoles');

        batch.update(StaffRolesDocRef, {
          [id]: values.roles.map((role) => role.value),
        });
      }

      await batch.commit();

      setCurrentStaffData((prev) => ({
        ...prev!,
        ...values,
        roles: values.roles.map((role) => role.value),
      }));

      setStaffNames((prev) => ({
        ...prev,
        [id]: values.name,
      }));

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
        <Paper sx={{ px: 3, py: 2, mb: 3 }}>
          <Typography variant='h2'>Select Staff</Typography>
          <SelectElement
            name='id'
            label='Staff'
            options={Object.entries(staffNames).map(([id, label]) => ({
              id,
              label,
            }))}
            onChange={changeStaff}
            required
            fullWidth
            margin='normal'
          />
        </Paper>
        {isLoadingStaff && <CircularProgress />}
        {!!currentId && !isLoadingStaff && (
          <>
            <Paper sx={{ px: 3, py: 2, mb: 3 }}>
              <Typography variant='h2'>General</Typography>
              <TextFieldElement
                name='name'
                label='Name'
                required
                fullWidth
                margin='normal'
              />
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
            <Paper sx={{ px: 3, py: 2, mb: 3 }}>
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
            <Paper sx={{ px: 3, py: 2, mb: 3 }}>
              <Typography variant='h2' sx={{ mb: 2 }}>
                Involvements
              </Typography>
              {games.map((game, idx) => (
                <Paper
                  key={game.id}
                  sx={{ mb: 2, p: 2, backgroundColor: 'background.default' }}
                >
                  <Stack direction='column' sx={{ mt: -1 }}>
                    <AutocompleteElement
                      name={`games.${idx}.gameId`}
                      label={`Game ${idx + 1}`}
                      options={Object.entries(gameNames)
                        .map(([id, label]) => ({
                          id,
                          label,
                        }))
                        .filter(
                          ({ id }) =>
                            // remove games that are already selected
                            !games.some((g) => g.gameId === id) ||
                            game.gameId === id
                        )}
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
                      ]}
                      multiple
                      autocompleteProps={{ fullWidth: true, freeSolo: true }}
                      textFieldProps={{ margin: 'normal' }}
                      matchId
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
                </Paper>
              ))}
              <Button
                variant='outlined'
                onClick={() => appendGame({ gameId: '', roles: [] })}
                fullWidth
                disabled={games.length >= Object.keys(gameNames).length}
              >
                Add Game
              </Button>
            </Paper>
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
