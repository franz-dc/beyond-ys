// used for character avatar only
import { FC, useState } from 'react';

import Image from 'next/image';
import type { ImageProps } from 'next/image';

export interface ImageWithFallbackProps extends ImageProps {
  fallback: ImageProps['src'];
  imageDirection?: 'left' | 'right';
}

const ImageWithFallback: FC<ImageWithFallbackProps> = ({
  src,
  fallback,
  imageDirection = 'left',
  ...rest
}) => {
  const [isError, setIsError] = useState(false);

  const newImageDirection = isError ? 'left' : imageDirection;

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image
        {...rest}
        src={isError ? fallback : src}
        onError={() => setIsError(true)}
        style={{
          ...rest.style,
          transform: newImageDirection === 'right' ? 'scaleX(-1)' : 'none',
          borderBottomLeftRadius: imageDirection === 'right' ? 8 : 0,
          borderBottomRightRadius: imageDirection === 'left' ? 8 : 0,
        }}
      />
    </>
  );
};

export default ImageWithFallback;
