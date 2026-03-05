"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebouncedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function DebouncedSearchInput({
  value,
  onChange,
  debounceMs = 500,
  placeholder = "Search...",
  className,
  inputClassName,
}: DebouncedSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync with external value if it changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, debounceMs, onChange, value]);

  return (
    <div className={cn("relative flex-1 min-w-0", className)}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className={cn(
          "pl-9 pr-4 w-full rounded-[2.0625rem] border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20",
          inputClassName,
        )}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
    </div>
  );
}
