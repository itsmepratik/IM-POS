"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InventorySearchInputProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  placeholder?: string;
  variant?: "default" | "pill";
  className?: string;
  inputClassName?: string;
}

export function InventorySearchInput({
  searchQuery,
  onSearchQueryChange,
  placeholder = "Search...",
  variant = "default",
  className,
  inputClassName,
}: InventorySearchInputProps) {
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const handleSearch = useCallback(() => {
    onSearchQueryChange(searchInput.trim());
  }, [searchInput, onSearchQueryChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      } else if (e.key === "Escape") {
        setSearchInput("");
        onSearchQueryChange("");
      }
    },
    [handleSearch, onSearchQueryChange],
  );

  const handleClear = useCallback(() => {
    setSearchInput("");
    onSearchQueryChange("");
  }, [onSearchQueryChange]);

  const showClear = Boolean(searchInput && searchInput.length > 0);

  return (
    <div className={cn("relative flex-1 min-w-0 flex items-center", className)}>
      <button
        type="button"
        onClick={handleSearch}
        aria-label="Search"
        title="Search"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Search className="h-4 w-4" />
      </button>
      <Input
        type="search"
        placeholder={placeholder}
        className={cn(
          variant === "pill"
            ? "pl-9 pr-9 w-full rounded-[2.0625rem] border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            : "w-full pl-9 pr-9",
          inputClassName,
        )}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={handleKeyDown}
        suppressHydrationWarning
      />
      {showClear && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
