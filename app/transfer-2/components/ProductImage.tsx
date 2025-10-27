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
  const [imgSrc, setImgSrc] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorCount, setErrorCount] = React.useState(0);

  // Size configurations
  const sizeConfig = {
    sm: { container: "w-8 h-8", icon: "h-4 w-4" },
    md: { container: "w-12 h-12", icon: "h-6 w-6" },
    lg: { container: "w-16 h-16", icon: "h-8 w-8" },
  };

  const currentSize = sizeConfig[size];

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

  // Generate fallback paths
  const generateFallbackPaths = () => {
    const brandName = (product.brand || "generic")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const categoryName = (product.category || "generic")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const fallbackPaths: string[] = [];

    // Try different image field names from product data first
    const productImageUrls = [
      (product as any).imageUrl,
      (product as any).image,
      (product as any).image_url,
    ].filter(Boolean);

    fallbackPaths.push(...productImageUrls);

    // Brand-based images
    fallbackPaths.push(
      `/images/brands/${brandName}.png`,
      `/images/brands/${brandName}.svg`,
      `/images/brands/${brandName}.jpg`
    );

    // Category-based images
    fallbackPaths.push(
      `/images/products/${categoryName}.png`,
      `/images/products/${categoryName}.svg`,
      `/images/products/${categoryName}.jpg`
    );

    // Generic fallbacks
    fallbackPaths.push(
      `/images/products/generic.png`,
      `/images/products/generic.svg`,
      `/images/oil.png` // Ultimate fallback
    );

    return fallbackPaths;
  };

  // Set initial image source
  React.useEffect(() => {
    const setImageSource = async () => {
      const fallbackPaths = generateFallbackPaths();

      // Try each fallback path
      for (const path of fallbackPaths) {
        if (isValidImageUrl(path)) {
          console.log(`[ProductImage] Trying: ${path}`);
          try {
            const response = await fetch(path, { method: "HEAD" });
            if (response.ok) {
              console.log(`[ProductImage] Found image: ${path}`);
              setImgSrc(path);
              setIsLoading(true);
              return;
            }
          } catch (error) {
            console.log(`[ProductImage] Fallback ${path} not available`);
          }
        }
      }

      // If no fallback found, show icon
      console.log(
        `[ProductImage] No images available for ${product.brand} ${product.name}`
      );
      setIsLoading(false);
    };

    setImageSource();
  }, [product.brand, product.name, product.category]);

  const handleError = React.useCallback(async () => {
    console.warn(
      `[ProductImage] Image error for ${product.brand} ${product.name}, current src: ${imgSrc}, error count: ${errorCount}`
    );

    setErrorCount((c) => c + 1);
    setIsLoading(false);

    // Mark current image as invalid
    if (imgSrc) {
      cacheImageInvalid(imgSrc);
    }

    const fallbackPaths = generateFallbackPaths();
    const currentIndex = fallbackPaths.findIndex(
      (path) =>
        imgSrc.includes(path) || imgSrc.endsWith(path.split("/").pop() || "")
    );
    const nextIndex = currentIndex + 1;

    if (nextIndex < fallbackPaths.length) {
      const nextPath = fallbackPaths[nextIndex];
      console.log(`[ProductImage] Trying next fallback: ${nextPath}`);
      setImgSrc(nextPath);
      setIsLoading(true);
      return;
    }

    // If all attempts fail, show icon
    console.log(
      `[ProductImage] All fallback attempts failed for ${product.brand} ${product.name}`
    );
  }, [imgSrc, errorCount, product.brand, product.name]);

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
      <div
        className={`flex items-center justify-center rounded-lg border-2 bg-muted ${currentSize.container} ${className}`}
      >
        <div className="opacity-50">
          <Package className={currentSize.icon} />
        </div>
      </div>
    );
  }

  // Show error state after all attempts
  if (!imgSrc || errorCount >= generateFallbackPaths().length) {
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

  // If we have an image URL and haven't failed too many times, show the image
  return (
    <div className={`relative ${currentSize.container} ${className}`}>
      <ImageErrorFallback
        onError={(error) => {
          console.error(
            `Product image error for ${product.brand} ${product.name}:`,
            error
          );
          handleError();
        }}
        className="w-full h-full"
      >
        <Image
          src={imgSrc}
          alt={`${product.brand || ""} ${product.name}`}
          className="object-contain rounded-md bg-white shadow-sm"
          fill
          sizes={`${currentSize.container.replace("w-", "").replace("h-", "")}`}
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
          quality={85}
          crossOrigin="anonymous"
        />
      </ImageErrorFallback>
    </div>
  );
}
