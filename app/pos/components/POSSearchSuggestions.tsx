"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface POSSearchSuggestionItem {
  key: string;
  label: string;
  brand?: string;
  category: string;
  imageUrl?: string;
}

interface POSSearchSuggestionsProps {
  activeCategory: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  suggestions: POSSearchSuggestionItem[];
  onSelectSuggestion: (suggestion: POSSearchSuggestionItem) => void;
}

export function POSSearchSuggestions({
  activeCategory,
  searchQuery,
  onSearchQueryChange,
  suggestions,
  onSelectSuggestion,
}: POSSearchSuggestionsProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hasOpenDialog, setHasOpenDialog] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkForOpenDialog = () => {
      setHasOpenDialog(
        !!document.querySelector('[role="dialog"][data-state="open"]'),
      );
    };

    checkForOpenDialog();

    const observer = new MutationObserver(checkForOpenDialog);
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (hasOpenDialog) {
      setIsSearchFocused(false);
      setDropdownRect(null);
    }
  }, [hasOpenDialog]);

  const showSuggestions =
    !hasOpenDialog && isSearchFocused && searchQuery.trim().length > 0;

  useEffect(() => {
    if (!showSuggestions) {
      setDropdownRect(null);
      return;
    }

    const updatePosition = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const margin = 8;
      const preferredHeight = 420;
      const gap = 4;
      const spaceBelow = viewportHeight - rect.bottom - margin - gap;
      const spaceAbove = rect.top - margin - gap;

      let top = rect.bottom + gap;
      let height = preferredHeight;

      if (spaceBelow >= preferredHeight) {
        // Keep preferred fixed size below input.
        top = rect.bottom + gap;
        height = preferredHeight;
      } else if (spaceAbove >= preferredHeight) {
        // Flip above input with preferred fixed size.
        top = rect.top - gap - preferredHeight;
        height = preferredHeight;
      } else {
        // Not enough room either side: use the larger available side and clamp height.
        const useBelow = spaceBelow >= spaceAbove;
        const available = Math.max(useBelow ? spaceBelow : spaceAbove, 160);
        height = Math.min(preferredHeight, available);
        top = useBelow ? rect.bottom + gap : rect.top - gap - height;
      }

      setDropdownRect({
        top,
        left: rect.left,
        width: rect.width,
        height,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showSuggestions, searchQuery]);

  return (
    <div ref={wrapperRef} className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={`Search in ${activeCategory}...`}
        className="pl-9 h-10 text-base"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => {
          setTimeout(() => setIsSearchFocused(false), 120);
        }}
        suppressHydrationWarning
      />

      {isMounted &&
        showSuggestions &&
        dropdownRect &&
        createPortal(
          <div
            className="fixed z-40 rounded-md border bg-background shadow-lg overflow-y-auto"
            style={{
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              height: dropdownRect.height,
            }}
          >
            {suggestions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No products found
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.key}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectSuggestion(suggestion);
                    onSearchQueryChange("");
                    setIsSearchFocused(false);
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded border bg-muted/30 overflow-hidden shrink-0">
                        {suggestion.imageUrl ? (
                          <img
                            src={suggestion.imageUrl}
                            alt={suggestion.label}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium line-clamp-1">
                        {suggestion.brand ? `${suggestion.brand} ` : ""}
                        {suggestion.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {suggestion.category}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
