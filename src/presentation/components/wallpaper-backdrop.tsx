import type { CSSProperties } from 'react';
import type { Wallpaper } from '../../domain/launcher';
import { wallpaperImageUrl } from '../wallpapers';

interface WallpaperBackdropProps {
  variant: Wallpaper;
  blurred?: boolean;
  /** Replacement asset; blur and contrast remain consistent for any image. */
  imageUrl?: string;
}

/** Shared treatment of current and future wallpapers, independent of app artwork. */
export function WallpaperBackdrop({ variant, imageUrl, blurred = true }: WallpaperBackdropProps) {
  const source = imageUrl ?? wallpaperImageUrl(variant);
  const imageStyle: CSSProperties = {
    backgroundImage: source ? `url(${JSON.stringify(source)})` : 'none',
  };
  return (
    <div
      className={`wallpaper-backdrop wallpaper--${variant} ${blurred ? '' : 'wallpaper-backdrop--sharp'}`}
      aria-hidden="true"
    >
      <div className="wallpaper-base" style={imageStyle} />
      {blurred && <div className="wallpaper-progressive" style={imageStyle} />}
      <div className="wallpaper-shade" />
    </div>
  );
}
