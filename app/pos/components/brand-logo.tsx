import React from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Brand } from "@/lib/services/inventoryService";
import {
  isValidImageUrl,
  isImageCached,
  cacheImageValid,
  cacheImageInvalid,
  preloadImage,
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
  const [imgSrc, setImgSrc] = React.useState<string>("");
  const [errorCount, setErrorCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

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

  // Enhanced URL validation using the cache utility

  // Set initial image source based on availability with caching
  React.useEffect(() => {
    const setImageSource = async () => {
      // Priority 1: Database image (if valid and cached)
      if (databaseImageUrl && isValidImageUrl(databaseImageUrl)) {
        if (isImageCached(databaseImageUrl)) {
          setImgSrc(databaseImageUrl);
          setIsLoading(false);
          return;
        } else {
          // Preload the image in the background
          preloadImage(databaseImageUrl).then((success) => {
            if (success) {
              setImgSrc(databaseImageUrl);
              setIsLoading(false);
            } else {
              // Database image failed, try fallback
              if (fallbackToLocal) {
                setImgSrc(`/images/${brand.toLowerCase()}.svg`);
                setIsLoading(true);
              } else {
                setIsLoading(false);
              }
            }
          });
          return;
        }
      }

      // Priority 2: Local fallback
      if (fallbackToLocal) {
        setImgSrc(`/images/${brand.toLowerCase()}.svg`);
        setIsLoading(true);
      } else {
        setIsLoading(false);
      }
    };

    setImageSource();
  }, [databaseImageUrl, brand, fallbackToLocal]);

  const handleError = React.useCallback(async () => {
    if (!imgSrc) return;

    setErrorCount((c) => c + 1);
    setIsLoading(false);

    // Mark the current image as invalid in cache
    cacheImageInvalid(imgSrc);

    if (errorCount === 0 && fallbackToLocal && !imgSrc.includes(".svg")) {
      // First error - try PNG fallback
      setImgSrc(`/images/${brand.toLowerCase()}.png`);
      setIsLoading(true);
    } else if (
      errorCount === 1 &&
      fallbackToLocal &&
      !imgSrc.includes(".png")
    ) {
      // Second error - try JPG fallback
      setImgSrc(`/images/${brand.toLowerCase()}.jpg`);
      setIsLoading(true);
    }
    // If all attempts fail, show icon
  }, [imgSrc, errorCount, brand, fallbackToLocal]);

  const handleLoad = React.useCallback(() => {
    if (imgSrc) {
      cacheImageValid(imgSrc);
    }
    setIsLoading(false);
    setErrorCount(0); // Reset error count on successful load
  }, [imgSrc]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
        <div className="animate-pulse">
          <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground opacity-50" />
        </div>
      </div>
    );
  }

  // Show error state after all attempts
  if (!imgSrc || errorCount >= (fallbackToLocal ? 3 : 1)) {
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
        className="object-contain rounded-md bg-white transition-opacity duration-200"
        fill
        sizes="(max-width: 768px) 48px, (max-width: 1024px) 64px, 80px"
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        quality={85}
        style={{
          // Ensure smooth loading transition
          opacity: isLoading ? 0 : 1,
        }}
      />
    </ImageErrorFallback>
  );
}
