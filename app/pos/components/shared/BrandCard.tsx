"use client";

import React, { useState } from "react";
import { BrandLogo } from "../brand-logo";
import { Brand } from "@/lib/services/inventoryService";

interface BrandCardProps {
  brand: string;
  onClick: () => void;
  productCount?: number;
  brands?: Brand[]; // Optional brands data for database images
  imageUrl?: string | null;
}

export function BrandCard({
  brand,
  onClick,
  productCount,
  brands,
  imageUrl,
}: BrandCardProps) {
  const [bgColor, setBgColor] = useState<string>("#ffffff");

  return (
    <button
      className="w-full h-full min-h-[150px] sm:min-h-[170px] md:min-h-[190px] flex flex-col overflow-hidden p-0 rounded-xl hover:bg-accent border-2 transition-all hover:scale-[1.02] group focus:outline-none focus:ring-2 focus:ring-muted-foreground/30"
      onClick={onClick}
      type="button"
    >
      <div
        className="relative flex-1 w-full transition-colors min-h-[100px] sm:min-h-[120px]"
        style={{ backgroundColor: bgColor }}
      >
        <div className="absolute inset-1 sm:inset-1 flex items-center justify-center">
          <BrandLogo
             brand={brand}
             brands={brands}
             imageUrl={imageUrl}
             onColorExtracted={(color) => setBgColor(color)}
          />
        </div>
      </div>
      <div className="w-full bg-slate-50 border-t py-2 px-3 shrink-0 flex flex-col items-center justify-center min-h-[48px] sm:min-h-[50px]">
        <span className="font-semibold text-center text-sm md:text-base break-words w-full line-clamp-1 block text-foreground leading-tight">
          {brand}
        </span>
        {productCount !== undefined && (
          <span className="text-xs text-muted-foreground mt-0.5">
            {productCount} products
          </span>
        )}
      </div>
    </button>
  );
}
