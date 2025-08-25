"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BrandCard } from "../shared/BrandCard";
import { usePOSMockData } from "@/lib/hooks/data/usePOSMockData";

interface FiltersCategoryProps {
  searchQuery?: string;
  selectedFilterType: string | null;
  setSelectedFilterType: (type: string | null) => void;
  setSelectedFilterBrand: (brand: string) => void;
  setSelectedFilters: (filters: any[]) => void;
  setIsFilterBrandModalOpen: (open: boolean) => void;
}

export function FiltersCategory({
  searchQuery = "",
  selectedFilterType,
  setSelectedFilterType,
  setSelectedFilterBrand,
  setSelectedFilters,
  setIsFilterBrandModalOpen,
}: FiltersCategoryProps) {
  const { filterTypes, filterBrands } = usePOSMockData();

  return (
    <div className="grid grid-cols-1 gap-4">
      {filterTypes
        .filter((type) =>
          type.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((type) => (
          <div key={type} className="border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              className="w-full p-4 flex items-center justify-between hover:bg-accent"
              onClick={() =>
                setSelectedFilterType(selectedFilterType === type ? null : type)
              }
            >
              <span className="font-semibold text-lg">{type}</span>
              {selectedFilterType === type ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
            {selectedFilterType === type && (
              <div
                className="p-4 bg-muted/50 grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                }}
              >
                {filterBrands.map((brand) => (
                  <BrandCard
                    key={brand}
                    brand={brand}
                    onClick={() => {
                      setSelectedFilterBrand(brand);
                      setSelectedFilters([]);
                      setIsFilterBrandModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
