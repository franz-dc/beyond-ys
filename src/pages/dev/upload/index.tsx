import { LoadingButton } from '@mui/lab';
import { ref, uploadBytes } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { FormContainer, TextFieldElement } from 'react-hook-form-mui';

import { GenericHeader, MainLayout } from '~/components';
import { storage } from '~/configs';

const Upload = () => {
  const formContext = useForm({
    defaultValues: {
      file: null,
      path: '',
    },
  });

  const {
    register,
    formState: { isSubmitting },
    handleSubmit,
  } = formContext;

  const uploadImage = async (data: any) => {
    try {
      const imageRef = ref(storage, data.path);
      await uploadBytes(imageRef, data.file[0]);
      alert('Image uploaded');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainLayout title='Upload'>
      <GenericHeader title='Upload' gutterBottom />
      <FormContainer
        formContext={formContext}
        handleSubmit={handleSubmit(uploadImage, (err) => console.error(err))}
      >
        <TextFieldElement
          name='path'
          label='Path'
          required
          fullWidth
          margin='normal'
        />
        <input type='file' {...register('file')} />
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

export default Upload;
