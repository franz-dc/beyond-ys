import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import {
  doc,
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
import slugify from 'slugify';
import { z } from 'zod';

import { GenericHeader, MainLayout, SwitchElement } from '~/components';
import { cacheCollection, charactersCollection, db } from '~/configs';
import { COUNTRIES } from '~/constants';
import { CharacterCacheSchema, characterSchema } from '~/schemas';

const AddCharacter = () => {
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
      id: z
        .string()
        .min(1)
        .refine((id) => !charactersCache[id], {
          message: 'Slug is already taken.',
        }),
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
      accentColor: '#161a22',
      imageDirection: 'left',
    },
    resolver: zodResolver(schema),
  });

  const {
    control,
    watch,
    getValues,
    setValue,
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

  const handleSave = async ({
    id,
    name,
    category,
    imageDirection,
    accentColor,
    ...rest
  }: Schema) => {
    // check if id is already taken (using the characterNames cache)
    // failsafe in case the user somehow bypasses the form validation
    if (charactersCache[id]) {
      throw new Error(`Slug '${id}' is already taken.`);
    }

    try {
      const characterDocRef = doc(charactersCollection, id);

      const batch = writeBatch(db);

      // create the character doc and fill the rest with blank data
      batch.set(characterDocRef, {
        name,
        category,
        imageDirection,
        accentColor,
        extraImages: [],
        gameIds: [],
        cachedGames: {},
        hasMainImage: false,
        hasAvatar: false,
        updatedAt: serverTimestamp(),
        ...rest,
      });

      // update the characters cache
      batch.update(doc(cacheCollection, 'characters'), {
        [id]: {
          name,
          category,
          imageDirection,
          accentColor,
          hasMainImage: false,
          hasAvatar: false,
        },
      });

      await batch.commit();

      // don't wait for onSnapshot to update the characterNames state
      setCharactersCache((prev) => ({
        ...prev,
        [id]: {
          name,
          category,
          imageDirection,
          accentColor,
          hasMainImage: false,
          hasAvatar: false,
        },
      }));

      reset();

      enqueueSnackbar('Character added.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to add character.', { variant: 'error' });
      console.error(err);
    }
  };

  const customSlug = watch('customSlug');

  return (
    <MainLayout title='Add Character'>
      <GenericHeader title='Add Character' gutterBottom />
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
                  remove: /[*+~.()'"!:@/]/g,
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
          <TextFieldElement
            name='name'
            label='Name'
            required
            fullWidth
            margin='normal'
            onChange={(e) => {
              if (customSlug) return;
              const name = e.target.value;
              const id = slugify(name, {
                lower: true,
                remove: /[*+~.()'"!:@/]/g,
              });

              setValue('id', id, { shouldValidate: true });
            }}
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
            disabled={voiceActors.length >= Object.entries(staffNames).length}
            sx={{ mt: 1 }}
          >
            Add Voice Actor
          </LoadingButton>
        </Paper>
        <LoadingButton
          type='submit'
          variant='contained'
          loading={isSubmitting || isLoadingCharactersCache}
          fullWidth
        >
          Submit
        </LoadingButton>
      </FormContainer>
    </MainLayout>
  );
};

export default AddCharacter;
