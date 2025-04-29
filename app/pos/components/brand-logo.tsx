import React from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface BrandLogoProps {
  brand: string;
}

export function BrandLogo({ brand }: BrandLogoProps) {
  const [imgSrc, setImgSrc] = React.useState(
    `/images/${brand.toLowerCase()}.svg`
  );
  const [errorCount, setErrorCount] = React.useState(0);

  if (errorCount >= 2) {
    // Both SVG and PNG failed
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
        <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={`${brand} logo`}
      className="object-contain rounded-md bg-white"
      fill
      sizes="(max-width: 768px) 48px, 64px"
      onError={() => {
        setErrorCount((c) => c + 1);
        setImgSrc(`/images/${brand.toLowerCase()}.png`);
      }}
    />
  );
}
