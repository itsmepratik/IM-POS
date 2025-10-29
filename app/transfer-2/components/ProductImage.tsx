import React from "react";
import Image from "next/image";
import { Package, Droplet, Settings, Wrench } from "lucide-react";
import {
  isValidImageUrl,
  cacheImageValid,
  cacheImageInvalid,
} from "@/lib/utils/imageCache";
import { ImageErrorFallback } from "@/components/ui/image-error-boundary";

interface ProductImageProps {
  product: {
    id: number;
    name: string;
    brand?: string;
    imageUrl?: string;
    image?: string;
    category?: string;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProductImage({
  product,
  size = "md",
  className = "",
}: ProductImageProps) {
  const [hasError, setHasError] = React.useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { container: "w-8 h-8", icon: "h-4 w-4" },
    md: { container: "w-12 h-12", icon: "h-6 w-6" },
    lg: { container: "w-24 h-24", icon: "h-12 w-12" }, // Larger size for product cards
  };

  const currentSize = sizeConfig[size];

  // Find the image URL from product data - prioritize database images
  const productImageUrl = React.useMemo(() => {
    return (
      (product as any).imageUrl ||
      (product as any).image ||
      (product as any).image_url ||
      null
    );
  }, [product]);

  // Determine which image source to use
  const imgSrc = React.useMemo(() => {
    // Use database image if available and valid
    if (productImageUrl && isValidImageUrl(productImageUrl)) {
      console.log(`[ProductImage] Using image URL for ${product.name}:`, productImageUrl);
      return productImageUrl;
    }
    // Otherwise return null to show fallback icon
    if (productImageUrl) {
      console.log(`[ProductImage] Invalid image URL for ${product.name}:`, productImageUrl);
    } else {
      console.log(`[ProductImage] No image URL for ${product.name}`);
    }
    return null;
  }, [productImageUrl, product.name]);

  // If no image or all image attempts failed, show category-based icon
  const getCategoryIcon = () => {
    switch (product.category) {
      case "Lubricants":
        return <Droplet className={currentSize.icon} />;
      case "Filters":
        return <Settings className={currentSize.icon} />;
      case "Parts":
        return <Wrench className={currentSize.icon} />;
      case "Additives & Fluids":
        return <Package className={currentSize.icon} />;
      default:
        return <Package className={currentSize.icon} />;
    }
  };

  const getCategoryColor = () => {
    switch (product.category) {
      case "Lubricants":
        return "bg-blue-50 border-blue-200 text-blue-600";
      case "Filters":
        return "bg-orange-50 border-orange-200 text-orange-600";
      case "Parts":
        return "bg-purple-50 border-purple-200 text-purple-600";
      case "Additives & Fluids":
        return "bg-green-50 border-green-200 text-green-600";
      default:
        return "bg-gray-50 border-gray-200 text-gray-600";
    }
  };

  const handleError = React.useCallback(
    (e?: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setHasError(true);
      if (imgSrc) {
        cacheImageInvalid(imgSrc);
        console.warn(`[ProductImage] Failed to load image for ${product.name}:`, imgSrc);
      }
      if (e) {
        e.currentTarget.onerror = null;
      }
    },
    [imgSrc, product.name]
  );

  const handleLoad = React.useCallback(() => {
    setHasError(false);
    if (imgSrc) {
      cacheImageValid(imgSrc);
      console.log(`[ProductImage] Successfully loaded image for ${product.name}`);
    }
  }, [imgSrc, product.name]);

  // Show fallback icon if no image source or error occurred
  if (!imgSrc || hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border-2 ${getCategoryColor()} ${
          currentSize.container
        } ${className}`}
      >
        <div className="opacity-80">{getCategoryIcon()}</div>
      </div>
    );
  }

  return (
    <div className={`relative ${currentSize.container} ${className}`}>
      <ImageErrorFallback
        onError={(error) => {
          console.error(`Product image error for ${product.brand} ${product.name}:`, error);
          handleError();
        }}
        className="w-full h-full"
      >
        <Image
          src={imgSrc}
          alt={`${product.brand || ""} ${product.name}`}
          className="object-contain rounded-md transition-opacity duration-200"
          fill
          sizes="(max-width: 768px) 96px, (max-width: 1024px) 128px, 192px"
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
          quality={85}
        />
      </ImageErrorFallback>
    </div>
  );
}
