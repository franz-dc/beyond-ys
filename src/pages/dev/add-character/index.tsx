import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import { Paper, Typography } from '@mui/material';
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
  useForm,
} from 'react-hook-form-mui';
import slugify from 'slugify';
import { z } from 'zod';

import { GenericHeader, MainLayout, SwitchElement } from '~/components';
import { cacheCollection, charactersCollection, db } from '~/configs';
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

  const schema = characterSchema
    .omit({
      imageGalleryPaths: true,
      gameIds: true,
      cachedGameNames: true,
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
      accentColor: '#000000',
      imageDirection: 'left',
    },
    resolver: zodResolver(schema),
  });

  const {
    watch,
    getValues,
    setValue,
    reset,
    formState: { isSubmitting },
    handleSubmit,
  } = formContext;

  const handleSave = async ({
    id,
    name,
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
        imageDirection,
        accentColor,
        imageGalleryPaths: [],
        gameIds: [],
        cachedGameNames: {},
        updatedAt: serverTimestamp(),
        ...rest,
      });

      // update the characters cache
      batch.update(doc(cacheCollection, 'characters'), {
        [id]: {
          name,
          imageDirection,
          accentColor,
        },
      });

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
                  remove: /[*+~.()'"!:@]/g,
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
                remove: /[*+~.()'"!:@]/g,
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
