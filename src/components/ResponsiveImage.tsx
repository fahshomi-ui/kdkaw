import { useEffect, useMemo, useState, type ImgHTMLAttributes } from 'react';
import manifest from '@/data/image-variants.json';

type Variant = { src: string; width: number; height: number; bytes: number };
type ImageEntry = { width: number; height: number; variants: Variant[] };
const images = manifest as Record<string, ImageEntry>;
const importedAssetEntries = Object.entries(images).filter(([key]) => key.startsWith('/src/assets/'));

export const getImageVariants = (src?: string): ImageEntry | undefined => {
  if (!src) return undefined;
  const path = src.split('?')[0];
  if (images[path]) return images[path];
  const file = path.split('/').pop() || '';
  return importedAssetEntries.find(([key]) => {
    const originalFile = key.split('/').pop() || '';
    const stem = originalFile.replace(/\.[^.]+$/, '');
    return file === originalFile || file.startsWith(`${stem}-`);
  })?.[1];
};

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean;
}

const ResponsiveImage = ({ src, sizes = '(max-width: 640px) 45vw, (max-width: 1200px) 30vw, 260px', priority = false, onError, ...props }: Props) => {
  const entry = useMemo(() => getImageVariants(src), [src]);
  const [fallback, setFallback] = useState(false);
  useEffect(() => setFallback(false), [src]);
  const variants = entry?.variants || [];
  const defaultImage = variants.find((variant) => variant.width >= 640) || variants[variants.length - 1];
  const optimized = !fallback && defaultImage;
  return (
    <img
      {...props}
      src={optimized ? defaultImage.src : src}
      srcSet={optimized ? variants.map((variant) => `${variant.src} ${variant.width}w`).join(', ') : undefined}
      sizes={optimized ? sizes : undefined}
      decoding="async"
      loading={priority ? 'eager' : (props.loading || 'lazy')}
      fetchPriority={priority ? 'high' : 'auto'}
      onError={(event) => {
        if (optimized) setFallback(true);
        else onError?.(event);
      }}
    />
  );
};

export default ResponsiveImage;
