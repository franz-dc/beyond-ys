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
import {
  FormContainer,
  SwitchElement,
  TextFieldElement,
  useForm,
} from 'react-hook-form-mui';
import slugify from 'slugify';
import { z } from 'zod';

import { GenericHeader, MainLayout } from '~/components';
import { cacheCollection, db, staffInfosCollection } from '~/configs';

const AddStaff = () => {
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});

  // doing this in case someone else added a staff member while the user is
  // filling this form. this will update the validation in real time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(cacheCollection, 'staffNames'),
      (docSnap) => {
        setStaffNames(docSnap.data() || {});
      }
    );

    return () => unsubscribe();
  }, []);

  const schema = z
    .object({
      id: z
        .string()
        .min(1)
        .refine((id) => !staffNames[id], {
          message: 'Slug is already taken.',
        }),
      name: z.string().min(1),
      customSlug: z.boolean(),
    })
    .passthrough();

  type Schema = z.infer<typeof schema> & {
    id: string | null;
  };

  const formContext = useForm<Schema>({
    defaultValues: {
      id: '',
      name: '',
      customSlug: false,
    },
    resolver: zodResolver(schema),
  });

  const {
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
    handleSubmit,
  } = formContext;

  const handleSave = async ({ id, name }: Schema) => {
    // check if id is already taken (using the staffNames cache)
    // failsafe in case the user somehow bypasses the form validation
    if (staffNames[id]) {
      throw new Error(`Slug '${id}' is already taken.`);
    }

    try {
      const staffInfoDocRef = doc(staffInfosCollection, id);

      const batch = writeBatch(db);

      // create the staff info doc and fill the rest with blank data
      batch.set(staffInfoDocRef, {
        name,
        description: '',
        descriptionSourceName: '',
        descriptionSourceUrl: '',
        roles: [],
        games: [],
        updatedAt: serverTimestamp(),
        cachedMusic: [],
      });

      // update the staffNames cache
      batch.update(doc(cacheCollection, 'staffNames'), {
        [id]: name,
      });

      // update the staffRoles cache
      batch.update(doc(cacheCollection, 'staffRoles'), {
        [id]: [],
      });

      await batch.commit();

      // don't wait for onSnapshot to update the staffNames state
      setStaffNames((prev) => ({ ...prev, [id]: name }));

      reset();
      alert('Staff member successfully added.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainLayout title='Add Staff'>
      <GenericHeader title='Add Staff' gutterBottom />
      <FormContainer
        formContext={formContext}
        handleSubmit={handleSubmit(handleSave, (err) => console.error(err))}
      >
        <Paper sx={{ px: 3, py: 2, mb: 3 }}>
          <Typography variant='h2' sx={{ mb: 1 }}>
            Basic Info
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
            required
            fullWidth
            margin='normal'
            onChange={(e) => {
              const name = e.target.value;
              const id = slugify(name, { lower: true });

              setValue('id', id, { shouldValidate: true });
            }}
          />
        </Paper>
        <LoadingButton
          type='submit'
          variant='contained'
          loading={isSubmitting}
          fullWidth
        >
          Submit
        </LoadingButton>
      </FormContainer>
    </MainLayout>
  );
};

export default AddStaff;
