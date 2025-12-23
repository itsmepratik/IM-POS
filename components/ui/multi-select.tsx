"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter out invalid selected values
  const validSelected = selected.filter((s) =>
    options.some((o) => o.value === s)
  );

  const handleUnselect = (value: string) => {
    onChange(validSelected.filter((s) => s !== value));
  };

  const handleSelect = (value: string) => {
    if (validSelected.includes(value)) {
      handleUnselect(value);
    } else {
      onChange([...validSelected, value]);
    }
  };

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  // Click outside handler
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus input when opening
  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer",
          open ? "ring-2 ring-ring ring-offset-2" : "hover:bg-accent/50"
        )}
        onClick={() => {
            setOpen(!open);
            if (!open) setSearch(""); // Reset search on open
        }}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {validSelected.length > 0 ? (
            validSelected.map((value) => {
              const option = options.find((o) => o.value === value);
              return (
                <Badge
                  key={value}
                  variant="secondary"
                  className="mr-1 mb-1 font-normal"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnselect(value);
                  }}
                >
                  {option?.label}
                  <div
                    className="ml-1 rounded-full outline-none hover:bg-destructive hover:text-destructive-foreground"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                          e.stopPropagation();
                          handleUnselect(value);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </div>
                </Badge>
              );
            })
          ) : (
            <span className="text-muted-foreground font-normal">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
      </div>

      {open && (
        <div className="absolute top-full z-[9999] mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center border-b px-3" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search..."
              autoFocus
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto overflow-x-hidden p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No options found.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => {
                  const isSelected = validSelected.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(option.value);
                        // Don't close to allow multiple selection
                        inputRef.current?.focus();
                      }}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <span>{option.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
