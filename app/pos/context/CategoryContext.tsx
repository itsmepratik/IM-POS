"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CategoryType } from "../types";

interface CategoryContextType {
  activeCategory: CategoryType;
  setActiveCategory: (category: CategoryType) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined
);

interface CategoryProviderProps {
  children: ReactNode;
  initialCategory?: CategoryType;
}

export function CategoryProvider({
  children,
  initialCategory = "Lubricants",
}: CategoryProviderProps) {
  const [activeCategory, setActiveCategory] =
    useState<CategoryType>(initialCategory);

  return (
    <CategoryContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error("useCategory must be used within a CategoryProvider");
  }
  return context;
}



