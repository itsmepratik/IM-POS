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
  const [useBrandfetchFallback, setUseBrandfetchFallback] = React.useState(false);
  const hasLoadedRef = React.useRef(false);

  // Find the brand data from the database
  const brandData = React.useMemo(() => {
    return brands?.find((b) => {
      const dbName = b.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const propName = brand.toLowerCase().replace(/[^a-z0-9]/g, "");
      return dbName === propName;
    });
  }, [brands, brand]);

  // Get the image URL from brand data or direct prop
  const databaseImageUrl = React.useMemo(() => {
    if (imageUrl) return imageUrl;
    if (!(brandData as any)?.image_url && !(brandData as any)?.imageUrl)
      return null;
    return (brandData as any)?.image_url || (brandData as any)?.imageUrl;
  }, [brandData, imageUrl]);

  // Determine which image source to use
  const imgSrc = React.useMemo(() => {
    let brandfetchUrl = null;
    if (brand && typeof brand === "string" && brand.trim() !== "") {
      const sanitizedDomain = brand.toLowerCase().replace(/[^a-z0-9]/g, "");
      const clientId = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID || "";
      brandfetchUrl = `https://cdn.brandfetch.io/${sanitizedDomain}.com?c=${clientId}`;
    }

    // Use database image if available and valid and we haven't failed yet
    if (!useBrandfetchFallback && databaseImageUrl && isValidImageUrl(databaseImageUrl)) {
      return databaseImageUrl;
    }

    return brandfetchUrl;
  }, [databaseImageUrl, brand, useBrandfetchFallback]);

  // Reset states when brand or external URL changes fundamentally
  React.useEffect(() => {
    setUseBrandfetchFallback(false);
  }, [brand, databaseImageUrl]);

  // Reset loaded ref when imgSrc changes
  React.useEffect(() => {
    hasLoadedRef.current = false;
    setHasError(false);
  }, [imgSrc]);

  const handleError = React.useCallback(
    (e?: any) => {
      if (!useBrandfetchFallback && databaseImageUrl && imgSrc === databaseImageUrl) {
        // Fallback to brandfetch if DB image failed
        setUseBrandfetchFallback(true);
      } else {
        setHasError(true);
      }
      
      if (imgSrc) {
        cacheImageInvalid(imgSrc);
      }
      if (e) {
        e.currentTarget.onerror = null;
      }
    },
    [imgSrc, useBrandfetchFallback, databaseImageUrl],
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

  const requiresCrossOrigin = React.useMemo(() => {
    if (!imgSrc) return false;
    return imgSrc.includes("brandfetch.io") || imgSrc.includes("supabase.co");
  }, [imgSrc]);

  return (
    <ImageErrorFallback onError={handleError} className="w-full h-full">
      <img
        src={imgSrc}
        alt={`${brand} logo`}
        className="w-full h-full object-contain rounded-md transition-opacity duration-200"
        onError={handleError}
        onLoad={handleLoad as any}
        loading="lazy"
        crossOrigin={requiresCrossOrigin ? "anonymous" : undefined}
      />
    </ImageErrorFallback>
  );
}
