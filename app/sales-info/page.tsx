"use client";

import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Layout } from "@/components/layout";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSalesInfo } from "@/lib/hooks/data/useSalesInfo";

interface SaleItemVariant {
  size: string;
  quantity: number;
  unitPrice: number;
  totalSales: number;
}

interface SaleItem {
  name: string;
  category: "fluid" | "part" | "service";
  quantity: number;
  unitPrice: number;
  totalSales: number;
  variants?: SaleItemVariant[];
  storeId: string;
}

const stores = [
  { id: "all-stores", name: "All Stores" },
  { id: "store1", name: "Main (Sanaya)" },
  { id: "store2", name: "Hafith" },
  { id: "store3", name: "Abu-Dhurus" },
];

// Memoize the mobile item card component
const MobileItemCard = memo(
  ({
    item,
    isExpanded,
    onToggle,
  }: {
    item: SaleItem;
    isExpanded: boolean;
    onToggle: () => void;
  }) => {
    return (
      <Card className="overflow-hidden">
        <div
          className={`p-4 ${item.category === "fluid" ? "cursor-pointer" : ""}`}
          onClick={() => item.category === "fluid" && onToggle()}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {item.quantity} units at OMR {item.unitPrice.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                OMR {item.totalSales.toFixed(2)}
              </div>
              {item.category === "fluid" && (
                <div className="text-blue-500 mt-1">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
          </div>

          {item.category === "fluid" && isExpanded && item.variants && (
            <div className="mt-4 border-t pt-4 space-y-3">
              {item.variants.map((variant) => (
                <div
                  key={variant.size}
                  className="flex items-center justify-between text-sm text-gray-600"
                >
                  <div>
                    <span className="font-medium">{variant.size}</span>
                    <p className="text-xs mt-0.5">
                      {variant.quantity} units at OMR{" "}
                      {variant.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="font-medium">
                    OMR {variant.totalSales.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }
);
MobileItemCard.displayName = "MobileItemCard";

// Memoize the desktop view component
const DesktopView = memo(
  ({
    salesData,
    expandedItems,
    toggleItem,
  }: {
    salesData: SaleItem[];
    expandedItems: string[];
    toggleItem: (name: string) => void;
  }) => {
    const totalSales = useMemo(
      () => salesData.reduce((sum, item) => sum + item.totalSales, 0),
      [salesData]
    );

    return (
      <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Item Name</th>
              <th className="px-6 py-3">Store</th>
              <th className="px-6 py-3 text-right">Quantity</th>
              <th className="px-6 py-3 text-right">Unit Price</th>
              <th className="px-6 py-3 text-right">Total Sales</th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((item) => (
              <React.Fragment key={item.name}>
                <tr
                  className={`border-b ${
                    item.category === "fluid"
                      ? "cursor-pointer hover:bg-gray-50"
                      : ""
                  }`}
                  onClick={() =>
                    item.category === "fluid" && toggleItem(item.name)
                  }
                >
                  <td className="px-6 py-4 font-medium">
                    <span
                      className={
                        item.category === "fluid"
                          ? `${
                              expandedItems.includes(item.name)
                                ? "text-primary"
                                : "text-gray-900"
                            } hover:text-primary transition-colors`
                          : ""
                      }
                    >
                      {item.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {stores.find((store) => store.id === item.storeId)?.name}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.quantity} units
                  </td>
                  <td className="px-6 py-4 text-right">
                    OMR {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    OMR {item.totalSales.toFixed(2)}
                  </td>
                </tr>
                {item.category === "fluid" &&
                  expandedItems.includes(item.name) &&
                  item.variants?.map((variant) => (
                    <tr
                      key={`${item.name}-${variant.size}`}
                      className="border-b bg-gray-50"
                    >
                      <td className="px-6 py-3 pl-12 text-sm text-gray-600">
                        {variant.size}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600"></td>
                      <td className="px-6 py-3 text-right text-sm text-gray-600">
                        {variant.quantity} units
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-600">
                        OMR {variant.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-600">
                        OMR {variant.totalSales.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-lg">
              <td colSpan={4} className="px-6 pt-8">
                Total Sales
              </td>
              <td className="px-6 pt-8 text-right">
                OMR {totalSales.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }
);
DesktopView.displayName = "DesktopView";

// Memoize the mobile view component
const MobileView = memo(
  ({
    salesData,
    expandedItems,
    toggleItem,
  }: {
    salesData: SaleItem[];
    expandedItems: string[];
    toggleItem: (name: string) => void;
  }) => {
    const totalSales = useMemo(
      () => salesData.reduce((sum, item) => sum + item.totalSales, 0),
      [salesData]
    );

    return (
      <div className="space-y-4">
        {salesData.map((item) => (
          <MobileItemCard
            key={item.name}
            item={item}
            isExpanded={expandedItems.includes(item.name)}
            onToggle={() => toggleItem(item.name)}
          />
        ))}
        <Card className="p-4 mt-6">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>OMR {totalSales.toFixed(2)}</span>
          </div>
        </Card>
      </div>
    );
  }
);
MobileView.displayName = "MobileView";

export default function SalesInfoPage() {
  const [selectedStore, setSelectedStore] = useState("all-stores");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const { items, stores, isLoading } = useSalesInfo();

  // Filter items based on selected store, category, and search query
  const filteredItems = items.filter((item) => {
    const matchesStore =
      selectedStore === "all-stores" || item.storeId === selectedStore;
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesStore && matchesCategory && matchesSearch;
  });

  // Calculate totals
  const totalSales = filteredItems.reduce(
    (sum, item) => sum + item.totalSales,
    0
  );
  const totalQuantity = filteredItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const averagePrice = totalSales / totalQuantity;

  const [isMobileView, setIsMobileView] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    // Initial check
    checkViewport();

    // Add event listener
    window.addEventListener("resize", checkViewport);

    // Set hasMounted to prevent hydration mismatch
    setHasMounted(true);

    // Cleanup
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const toggleItem = useCallback((itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  }, []);

  // Lazy load the view based on viewport
  const CurrentView = useMemo(() => {
    if (isMobileView) {
      return (
        <MobileView
          salesData={filteredItems}
          expandedItems={expandedItems}
          toggleItem={toggleItem}
        />
      );
    }
    return (
      <DesktopView
        salesData={filteredItems}
        expandedItems={expandedItems}
        toggleItem={toggleItem}
      />
    );
  }, [isMobileView, filteredItems, expandedItems, toggleItem]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold">Detailed Sales Report</h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <h2 className="text-lg font-semibold">Items Sold</h2>
          {hasMounted ? (
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="w-[180px] h-10" /> /* Placeholder to maintain layout */
          )}
        </div>

        <Card className={isMobileView ? "p-4" : "p-6"}>{CurrentView}</Card>
      </div>
    </Layout>
  );
}
