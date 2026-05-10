"use client";

import { useState } from "react";
import { BrandLogo } from "./brand-logo";
import { Brand } from "@/lib/services/inventoryService";

interface BrandCardProps {
  brand: string;
  imageUrl?: string | null;
  onClick: () => void;
  productCount?: number;
  brands?: Brand[];
}

export function BrandCard({
  brand,
  imageUrl,
  onClick,
  productCount,
  brands,
}: BrandCardProps) {
  const [bgColor, setBgColor] = useState<string>("transparent");

  return (
    <button
      onClick={onClick}
      type="button"
      className="w-full h-full min-h-[150px] sm:min-h-[170px] md:min-h-[190px] flex flex-col overflow-hidden p-0 rounded-xl hover:bg-accent border-2 transition-all hover:scale-[1.02] group"
    >
      <div
        className="relative flex-1 w-full transition-colors min-h-[100px] sm:min-h-[120px]"
        style={{
          backgroundColor: bgColor !== "transparent" ? bgColor : "#ffffff",
        }}
      >
        <div className="absolute inset-0 p-2 sm:p-3 md:p-4 flex items-center justify-center">
          <BrandLogo
            brand={brand}
            imageUrl={imageUrl}
            brands={brands}
            onColorExtracted={(color) => setBgColor(color)}
          />
        </div>
      </div>

      <div className="w-full bg-slate-50 border-t py-1 sm:py-1.5 px-3 shrink-0 flex flex-col items-center justify-center min-h-[32px] sm:min-h-[36px]">
        <span className="font-semibold text-center text-sm md:text-base break-words w-full line-clamp-1 block text-foreground leading-tight">
          {brand}
        </span>
        {productCount !== undefined && (
          <span className="text-xs text-muted-foreground mt-0.5 font-medium">
            {productCount} products
          </span>
        )}
      </div>
    </button>
  );
}
