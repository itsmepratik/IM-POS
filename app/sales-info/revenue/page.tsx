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
import { ExportButtons } from "@/components/ui/export-buttons";

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
  storeName?: string;
}

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
  },
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
      [salesData],
    );

    return (
      <div className="relative overflow-x-auto print:overflow-visible">
        <table className="w-full text-sm print:text-xs text-left">
          <thead className="text-xs print:text-[10px] uppercase bg-gray-50 print:bg-transparent">
            <tr>
              <th className="px-6 py-3 print:px-2 print:py-2">Item Name</th>
              <th className="px-6 py-3 print:px-2 print:py-2">Store</th>
              <th className="px-6 py-3 print:px-2 print:py-2 text-right">
                Quantity
              </th>
              <th className="px-6 py-3 print:px-2 print:py-2 text-right">
                Unit Price
              </th>
              <th className="px-6 py-3 print:px-2 print:py-2 text-right">
                Total Sales
              </th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((item) => (
              <React.Fragment key={`${item.name}-${item.storeId}`}>
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
                  <td className="px-6 py-4 print:px-2 print:py-2 font-medium">
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
                  <td className="px-6 py-4 print:px-2 print:py-2">
                    {item.storeName || item.storeId}
                  </td>
                  <td className="px-6 py-4 print:px-2 print:py-2 text-right">
                    {item.quantity} units
                  </td>
                  <td className="px-6 py-4 print:px-2 print:py-2 text-right">
                    OMR {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 print:px-2 print:py-2 text-right">
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
                      <td className="px-6 py-3 print:px-2 print:py-1 pl-12 print:pl-6 text-sm print:text-[10px] text-gray-600">
                        {variant.size}
                      </td>
                      <td className="px-6 py-3 print:px-2 print:py-1 text-sm print:text-[10px] text-gray-600"></td>
                      <td className="px-6 py-3 print:px-2 print:py-1 text-right text-sm print:text-[10px] text-gray-600">
                        {variant.quantity} units
                      </td>
                      <td className="px-6 py-3 print:px-2 print:py-1 text-right text-sm print:text-[10px] text-gray-600">
                        OMR {variant.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 print:px-2 print:py-1 text-right text-sm print:text-[10px] text-gray-600">
                        OMR {variant.totalSales.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
            <tr className="font-semibold text-lg print:text-sm">
              <td colSpan={4} className="px-6 pt-8 print:px-2 print:pt-4">
                Total Sales
              </td>
              <td className="px-6 pt-8 print:px-2 print:pt-4 text-right">
                OMR {totalSales.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  },
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
      [salesData],
    );

    return (
      <div className="space-y-4">
        {salesData.map((item) => (
          <MobileItemCard
            key={`${item.name}-${item.storeId}`}
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
  },
);
MobileView.displayName = "MobileView";

export default function RevenuePage() {
  const [selectedStore, setSelectedStore] = useState("all-stores");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Date range state
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(1)),
  ); // Start of current month
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { items, stores, isLoading, error } = useSalesInfo({
    startDate,
    endDate,
  });

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
    0,
  );
  const totalQuantity = filteredItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
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
        : [...prev, itemName],
    );
  }, []);

  // Lazy load the view based on viewport
  const CurrentView = useMemo(() => {
    if (error) {
      return (
        <div className="p-10 text-center text-red-500">
          <p className="font-semibold mb-2">Failed to load revenue data</p>
          <p className="text-sm">{error.message}</p>
        </div>
      );
    }

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
  }, [isMobileView, filteredItems, expandedItems, toggleItem, error]);

  return (
    <Layout>
      <div className="space-y-6 print:m-0 print:p-0 print:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between print:hidden mt-2">
          <h2 className="text-lg font-semibold">Items Sold</h2>
          {hasMounted ? (
            <div className="flex gap-4 flex-col md:flex-row md:items-center w-full sm:w-auto">
              <div className="flex gap-2 items-center justify-between md:justify-start w-full md:w-auto">
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="w-[180px] md:w-[200px] flex-1 md:flex-none">
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

                <div className="md:hidden">
                  <ExportButtons
                    data={filteredItems}
                    filename="Revenue_Report"
                    mapDataFn={(data) =>
                      data.map((item) => ({
                        "Item Name": item.name,
                        Store: item.storeName || item.storeId,
                        Quantity: item.quantity,
                        "Total Sales": item.totalSales.toFixed(3),
                      }))
                    }
                  />
                </div>
              </div>

              {/* Basic HTML Date Pickers for Simplicity & Robustness */}
              <div className="flex gap-2 items-center justify-between md:justify-start w-full md:w-auto">
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    className="border rounded p-2 text-sm"
                    value={
                      startDate ? startDate.toISOString().split("T")[0] : ""
                    }
                    onChange={(e) =>
                      setStartDate(
                        e.target.value ? new Date(e.target.value) : undefined,
                      )
                    }
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    className="border rounded p-2 text-sm"
                    value={endDate ? endDate.toISOString().split("T")[0] : ""}
                    onChange={(e) =>
                      setEndDate(
                        e.target.value ? new Date(e.target.value) : undefined,
                      )
                    }
                  />
                </div>

                <div className="hidden md:block">
                  <ExportButtons
                    data={filteredItems}
                    filename="Revenue_Report"
                    reportName="Revenue Data"
                    mapDataFn={(data) => {
                      // Flatten data for CSV
                      const flatRows: any[] = [];
                      data.forEach((item: SaleItem) => {
                        if (
                          item.category === "fluid" &&
                          item.variants &&
                          item.variants.length > 0
                        ) {
                          item.variants.forEach((variant) => {
                            flatRows.push({
                              "Item Name": item.name,
                              "Variant/Size": variant.size,
                              Category: item.category,
                              Store: item.storeName || item.storeId,
                              Quantity: variant.quantity,
                              "Unit Price": variant.unitPrice.toFixed(3),
                              "Total Sales": variant.totalSales.toFixed(3),
                            });
                          });
                        } else {
                          flatRows.push({
                            "Item Name": item.name,
                            "Variant/Size": "N/A",
                            Category: item.category,
                            Store: item.storeName || item.storeId,
                            Quantity: item.quantity,
                            "Unit Price": item.unitPrice.toFixed(3),
                            "Total Sales": item.totalSales.toFixed(3),
                          });
                        }
                      });
                      return flatRows;
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-[180px] h-10" /> /* Placeholder to maintain layout */
          )}
        </div>

        <Card
          className={`${isMobileView ? "p-4" : "p-6"} print:border-none print:shadow-none print:p-0`}
        >
          <div className="hidden print:block mb-6 pt-4 text-center">
            <h1 className="text-2xl font-bold">Revenue Report</h1>
            <p className="text-gray-500 text-sm mt-1">
              Generated: {new Date().toLocaleDateString()}
            </p>
          </div>
          {CurrentView}
        </Card>
      </div>
    </Layout>
  );
}
