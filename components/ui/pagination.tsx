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

    const maxVisiblePages = isMobile ? 5 : 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3);
        if (!isMobile) pages.push(4, 5);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        if (!isMobile) pages.push(totalPages - 4, totalPages - 3);
        pages.push(totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1);
        pages.push("...");
        if (!isMobile) pages.push(currentPage - 2);
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        if (!isMobile) pages.push(currentPage + 2);
        pages.push("...");
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
