// used for character avatar only
import { useState } from 'react';

import { Box } from '@mui/material';
import Image from 'next/image';
import type { ImageProps } from 'next/image';
import { MdNoAccounts } from 'react-icons/md';

const ImageWithFallback = (props: ImageProps) => {
  const [isError, setIsError] = useState(false);

  return (
    <>
      {!isError ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image
          {...props}
          onError={() => setIsError(true)}
          unoptimized
          draggable={false}
          style={{
            objectFit: 'contain',
            ...props.style,
          }}
        />
      ) : (
        <Box
          sx={{
            position: 'absolute',
            top: 68, // -32px, 50% of 64px
            transform: 'translateY(-50%)',
            right: 8,
            width: 56,
            height: 56,
          }}
        >
          <Box
            component={MdNoAccounts}
            sx={{
              width: '100%',
              height: '100%',
              color: 'divider',
            }}
          />
        </Box>
      )}
    </>
  );
};

export default ImageWithFallback;
