import React from "react";
import Image from "next/image";
import { Package, Droplet, Settings, Wrench } from "lucide-react";

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
  const [imgSrc, setImgSrc] = React.useState<string | null>(() => {
    // Try different image field names that might exist
    return (
      (product as any).imageUrl ||
      (product as any).image ||
      (product as any).image_url ||
      null
    );
  });
  const [errorCount, setErrorCount] = React.useState(0);

  // Size configurations
  const sizeConfig = {
    sm: { container: "w-8 h-8", icon: "h-4 w-4" },
    md: { container: "w-12 h-12", icon: "h-6 w-6" },
    lg: { container: "w-16 h-16", icon: "h-8 w-8" },
  };

  const currentSize = sizeConfig[size];

  // If we have an image URL and haven't failed too many times, show the image
  if (imgSrc && errorCount < 3) {
    return (
      <div className={`relative ${currentSize.container} ${className}`}>
        <Image
          src={imgSrc}
          alt={`${product.brand || ""} ${product.name}`}
          className="object-contain rounded-md bg-white shadow-sm"
          fill
          sizes={`${currentSize.container.replace("w-", "").replace("h-", "")}`}
          onError={() => {
            setErrorCount((c) => c + 1);
            // Try different image paths on error with better fallback logic
            if (errorCount === 0) {
              // Try the other image field
              const fallbackImage =
                (product as any).image || (product as any).image_url;
              if (fallbackImage && fallbackImage !== imgSrc) {
                setImgSrc(fallbackImage);
                return;
              }
            }

            if (errorCount === 1) {
              // Try brand-based image path (PNG first)
              const brandName = (product.brand || "generic")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
              setImgSrc(`/images/brands/${brandName}.png`);
              return;
            }

            if (errorCount === 2) {
              // Try SVG version
              const brandName = (product.brand || "generic")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
              setImgSrc(`/images/brands/${brandName}.svg`);
              return;
            }

            if (errorCount === 3) {
              // Try generic product images
              const categoryName = (product.category || "generic")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
              setImgSrc(`/images/products/${categoryName}.png`);
              return;
            }

            if (errorCount === 4) {
              // Try generic product SVG
              const categoryName = (product.category || "generic")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
              setImgSrc(`/images/products/${categoryName}.svg`);
              return;
            }

            // Give up and show icon
            setImgSrc(null);
          }}
        />
      </div>
    );
  }

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
