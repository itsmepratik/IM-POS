"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import Image from "next/image";
import { usePOSMockData } from "@/lib/hooks/data/usePOSMockData";

interface LubricantCategoryProps {
  searchQuery?: string;
  expandedBrand: string | null;
  setExpandedBrand: (brand: string | null) => void;
  onLubricantSelect: (lubricant: any) => void;
}

export function LubricantCategory({
  searchQuery = "",
  expandedBrand,
  setExpandedBrand,
  onLubricantSelect,
}: LubricantCategoryProps) {
  const { lubricantProducts, lubricantBrands } = usePOSMockData();

  // Filter brands based on search query
  const filteredLubricantBrands = useMemo(() => {
    return lubricantBrands.filter((brand) =>
      brand.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, lubricantBrands]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {filteredLubricantBrands.map((brand) => (
        <div key={brand} className="border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            className="w-full p-4 flex items-center justify-between hover:bg-accent"
            onClick={() =>
              setExpandedBrand(expandedBrand === brand ? null : brand)
            }
          >
            <span className="font-semibold text-lg">{brand}</span>
            {expandedBrand === brand ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
          {expandedBrand === brand && (
            <div className="p-4 bg-muted/50 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {lubricantProducts
                .filter((lubricant) => lubricant.brand === brand)
                .map((lubricant) => (
                  <Button
                    key={lubricant.id}
                    variant="outline"
                    className="border-2 rounded-[33px] flex flex-col items-center justify-between p-3 sm:p-4 h-[160px] sm:h-[180px] md:h-[200px] overflow-hidden"
                    onClick={() => onLubricantSelect(lubricant)}
                  >
                    <div className="relative w-16 h-16 sm:w-24 sm:h-24 mt-1 mb-1">
                      {lubricant.image ? (
                        <Image
                          src={lubricant.image}
                          alt={`${lubricant.brand} ${lubricant.type}`}
                          className="object-contain"
                          fill
                          sizes="(max-width: 768px) 64px, 96px"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            console.log(
                              `Error loading image for ${lubricant.brand} ${lubricant.type}`
                            );
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                          <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="text-center flex-1 flex flex-col justify-between">
                      <span
                        className="text-center font-medium text-xs sm:text-sm w-full px-1 word-wrap whitespace-normal leading-tight hyphens-auto"
                        style={{ lineHeight: 1.1 }}
                      >
                        {lubricant.type}
                      </span>
                      <span className="block text-sm text-primary mt-2">
                        OMR {lubricant.basePrice.toFixed(3)}
                      </span>
                    </div>
                  </Button>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
