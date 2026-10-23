import { useEffect, useState } from 'react';
import logoIcon from '@/assets/makany-foodz-icon.png';
import ResponsiveImage from '@/components/ResponsiveImage';

interface BrandedImageProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  lang?: 'ar' | 'en';
  isAiGenerated?: boolean;
}

const BrandedImage = ({ src, alt, className = '', size = 'md' }: BrandedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [src]);

  const watermarkSize = {
    sm: 'px-1 py-0.5 gap-0.5',
    md: 'px-1.5 py-0.5 gap-1',
    lg: 'px-2 py-1 gap-1.5',
  };
  const logoSize = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  const textSize = { sm: 'text-[7px]', md: 'text-[9px]', lg: 'text-[10px]' };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-muted/60 via-muted/30 to-muted/60">
      {/* Loading skeleton */}
      {!loaded && (
        <div className={`absolute inset-0 bg-muted animate-pulse ${className}`} />
      )}

      {/* Image with unified color treatment */}
      <ResponsiveImage
        src={src}
        alt={alt}
        className={`${className} transition-all duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        sizes={size === 'lg' ? '(max-width: 768px) 100vw, 640px' : '(max-width: 640px) 45vw, 300px'}
        loading="lazy"
      />

      {/* Subtle vignette overlay for depth */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_0_40px_rgba(0,0,0,0.2)]" />

      {/* Bottom gradient for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-foreground/10 to-transparent pointer-events-none" />

      {/* Brand watermark */}
      <div className={`absolute bottom-2 end-2 flex items-center ${watermarkSize[size]} bg-primary/90 backdrop-blur-sm rounded-md shadow-lg shadow-primary/20 max-w-[60%]`}>
        <img src={logoIcon} alt="" className={`${logoSize[size]} object-contain shrink-0`} />
        <span className={`text-primary-foreground ${textSize[size]} font-bold font-cairo leading-none tracking-wide`}>
          KDCow
        </span>
      </div>
    </div>
  );
};

export default BrandedImage;
