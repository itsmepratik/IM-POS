"use client";

import { useCategory as useCategoryContext } from "../context/CategoryContext";
import { CategoryType } from "../types";

// Re-export the context hook for convenience
export function useCategory() {
  return useCategoryContext();
}

// Additional utility functions for category management
export function getCategoryDisplayName(category: CategoryType): string {
  const displayNames: Record<CategoryType, string> = {
    Lubricants: "Lubricants",
    Filters: "Filters",
    Parts: "Parts",
    "Additives & Fluids": "Additives & Fluids",
  };

  return displayNames[category] || category;
}

export function getCategoryIcon(category: CategoryType): string {
  const icons: Record<CategoryType, string> = {
    Lubricants: "🛢️",
    Filters: "🔧",
    Parts: "⚙️",
    "Additives & Fluids": "💧",
  };

  return icons[category] || "📦";
}



