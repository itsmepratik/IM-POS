"use client";

import { Button } from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Button key={page} onClick={() => onPageChange(page)} variant={page === currentPage ? "default" : "outline"}>{page}</Button>
      ))}
      <Button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
    </div>
  );
}