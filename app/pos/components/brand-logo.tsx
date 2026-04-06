import React from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Brand } from "@/lib/services/inventoryService";
import {
  isValidImageUrl,
  cacheImageValid,
  cacheImageInvalid,
  isImageCached,
} from "@/lib/utils/imageCache";
import { ImageErrorFallback } from "@/components/ui/image-error-boundary";
import { FastAverageColor } from "fast-average-color";

interface BrandLogoProps {
  brand: string;
  brands?: Brand[]; // Optional brands data for database images
  imageUrl?: string | null; // Direct image URL
  onColorExtracted?: (color: string) => void;
}

export function BrandLogo({
  brand,
  brands,
  imageUrl,
  onColorExtracted,
}: BrandLogoProps) {
  const [hasError, setHasError] = React.useState(false);
  const hasLoadedRef = React.useRef(false);

  // Find the brand data from the database
  const brandData = React.useMemo(() => {
    return brands?.find((b) => b.name.toLowerCase() === brand.toLowerCase());
  }, [brands, brand]);

  // Get the image URL from brand data or direct prop
  const databaseImageUrl = React.useMemo(() => {
    if (imageUrl) return imageUrl;
    if (!brandData?.image_url) return null;
    return brandData.image_url;
  }, [brandData, imageUrl]);

  // Determine which image source to use
  const imgSrc = React.useMemo(() => {
    // Use database image if available and valid
    if (databaseImageUrl && isValidImageUrl(databaseImageUrl)) {
      return databaseImageUrl;
    }

    // Create Brandfetch CDN URL based on Brand string
    if (brand && typeof brand === "string" && brand.trim() !== "") {
      const sanitizedDomain = brand.toLowerCase().replace(/[^a-z0-9]/g, "");
      const clientId = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID || "";
      return `https://cdn.brandfetch.io/${sanitizedDomain}.com?c=${clientId}`;
    }

    // Otherwise return null to show fallback icon
    return null;
  }, [databaseImageUrl, brand]);

  // Reset loaded ref when imgSrc changes
  React.useEffect(() => {
    hasLoadedRef.current = false;
  }, [imgSrc]);

  const handleError = React.useCallback(
    (e?: any) => {
      setHasError(true);
      if (imgSrc) {
        cacheImageInvalid(imgSrc);
      }
      if (e) {
        e.currentTarget.onerror = null;
      }
    },
    [imgSrc],
  );

  const handleLoad = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      // Only cache if not already cached and not already loaded
      if (imgSrc && !hasLoadedRef.current && !isImageCached(imgSrc)) {
        setHasError(false);
        cacheImageValid(imgSrc);
        hasLoadedRef.current = true;
      }

      if (onColorExtracted && e.currentTarget) {
        try {
          const img = e.currentTarget;
          const canvas = document.createElement("canvas");
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            // Sample top-left edge pixel to get literal background color
            ctx.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
            if (a < 250) {
              // Transparent -> fallback to white
              onColorExtracted("#ffffff");
            } else {
              // Solid background -> match exact color
              onColorExtracted(`rgb(${r},${g},${b})`);
            }
          }
        } catch (err) {
          // Fallback if CORS prevents pixel reading
          onColorExtracted("#ffffff");
        }
      }
    },
    [imgSrc, onColorExtracted],
  );

  // Show fallback icon if no image source or error occurred
  if (!imgSrc || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
        <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <ImageErrorFallback onError={handleError} className="w-full h-full">
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
        unoptimized
        crossOrigin="anonymous"
      />
    </ImageErrorFallback>
  );
}
