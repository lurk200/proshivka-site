import React from 'react';
import { IMAGE_FALLBACK, handleImageError } from '../../utils/imageFallback';

export default function SafeImage({ src, alt = '', className = '', ...props }) {
  return (
    <img
      src={src || IMAGE_FALLBACK}
      alt={alt}
      className={className}
      onError={handleImageError}
      {...props}
    />
  );
}
