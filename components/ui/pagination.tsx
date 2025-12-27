"use client";

import * as React from "react";

import { Button } from "./button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 640px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    
    // Mobile: Show all pages to allow scrolling
    if (isMobile) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Desktop: Use ellipsis logic
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      // Add ellipsis after first page if there's a gap
      if (start > 2) {
        pages.push("...");
      }

      // Add pages around current page
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if there's a gap
      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  if (totalPages < 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8 mb-8 py-4 px-2 w-full">
      {/* Page info */}
      <div className="text-sm text-muted-foreground mr-2 hidden sm:block">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center gap-1 w-full sm:w-auto">
        {/* Fixed Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 sm:px-4 py-3 flex-shrink-0 my-0.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>

        {/* Scrollable Numbers Container */}
        {/* flex-1 ensures it takes available space between buttons on mobile */}
        {/* overflow-x-auto enables scrolling for numbers only */}
        {/* p-4 -my-4 ensures shadows are visible inside the scroll container */}
        <div className="flex-1 sm:flex-none flex items-center justify-start sm:justify-center gap-1 overflow-x-auto px-2 py-6 -my-4 hide-scrollbar">
          {pageNumbers.map((page, index) => (
            <div key={index} className="flex-shrink-0 my-0.5">
              {page === "..." ? (
                <div className="px-2 sm:px-3 py-3 text-muted-foreground flex items-center justify-center">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="min-w-[40px] sm:min-w-[44px] px-3 sm:px-4 py-3 transform-gpu"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Fixed Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 sm:px-4 py-3 flex-shrink-0 my-0.5"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
