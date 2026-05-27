"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      onSearchQueryChange(searchInput.trim());
    },
    [searchInput, onSearchQueryChange],
  );

  return (
    <div className={cn("relative flex-1 min-w-0", className)}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className={cn(
          variant === "pill"
            ? "pl-9 pr-4 w-full rounded-[2.0625rem] border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            : "w-full pl-9",
          inputClassName,
        )}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={handleKeyDown}
        suppressHydrationWarning
      />
    </div>
  );
}
