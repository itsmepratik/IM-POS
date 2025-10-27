import React from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Brand } from "@/lib/services/inventoryService";
import {
  isValidImageUrl,
  cacheImageValid,
  cacheImageInvalid,
} from "@/lib/utils/imageCache";
import { ImageErrorFallback } from "@/components/ui/image-error-boundary";

interface BrandLogoProps {
  brand: string;
  brands?: Brand[]; // Optional brands data for database images
  fallbackToLocal?: boolean; // Whether to fallback to local images
}

export function BrandLogo({
  brand,
  brands,
  fallbackToLocal = true,
}: BrandLogoProps) {
  const [hasError, setHasError] = React.useState(false);

  // Find the brand data from the database
  const brandData = React.useMemo(() => {
    return brands?.find((b) => b.name.toLowerCase() === brand.toLowerCase());
  }, [brands, brand]);

  // Get the primary image URL from brand data
  const databaseImageUrl = React.useMemo(() => {
    if (!brandData?.images) return null;

    // Handle different image data structures
    if (typeof brandData.images === "string") {
      return brandData.images;
    }

    if (typeof brandData.images === "object" && brandData.images !== null) {
      // If it's an object, try to get the first available image URL
      const images = brandData.images as any;
      if (images.primary) return images.primary;
      if (images.logo) return images.logo;
      if (images.url) return images.url;

      // If it's an array, get the first item
      if (Array.isArray(images) && images.length > 0) {
        return images[0].url || images[0];
      }
    }

    return null;
  }, [brandData]);

  // Determine which image source to use
  const imgSrc = React.useMemo(() => {
    // Use database image if available and valid
    if (databaseImageUrl && isValidImageUrl(databaseImageUrl)) {
      return databaseImageUrl;
    }
    // Otherwise return null to show fallback icon
    return null;
  }, [databaseImageUrl]);

  const handleError = React.useCallback(
    (e?: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setHasError(true);
      if (imgSrc) {
        cacheImageInvalid(imgSrc);
        console.warn(`Failed to load brand logo for ${brand}: ${imgSrc}`);
      }
      if (e) {
        e.currentTarget.onerror = null;
      }
    },
    [imgSrc, brand]
  );

  const handleLoad = React.useCallback(() => {
    setHasError(false);
    if (imgSrc) {
      cacheImageValid(imgSrc);
    }
  }, [imgSrc]);

  // Show fallback icon if no image source or error occurred
  if (!imgSrc || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
        <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <ImageErrorFallback
      onError={(error) => {
        console.error(`Brand logo error for ${brand}:`, error);
        handleError();
      }}
      className="w-full h-full"
    >
      <Image
        src={imgSrc}
        alt={`${brand} logo`}
        className="object-contain rounded-md transition-opacity duration-200"
        fill
        sizes="(max-width: 768px) 48px, (max-width: 1024px) 64px, 80px"
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        quality={85}
      />
    </ImageErrorFallback>
  );
}
