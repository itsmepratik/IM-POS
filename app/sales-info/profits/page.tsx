"use client";

import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useProfitsInfo } from "@/lib/hooks/data/useProfitsInfo";
import { ExportButtons } from "@/components/ui/export-buttons";

export const availableColumns = [
  { id: "shop", label: "Shop" },
  { id: "quantity", label: "Quantity" },
  { id: "unitCost", label: "Unit Cost" },
  { id: "unitPrice", label: "Unit Price" },
  { id: "revenue", label: "Revenue" },
  { id: "cost", label: "Cost" },
  { id: "profit", label: "Net Profit" },
  { id: "margin", label: "Margin (%)" },
];

interface ProfitItemVariant {
  size: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalSales: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

interface ProfitItem {
  name: string;
  category: "fluid" | "part" | "service";
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalSales: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  variants?: ProfitItemVariant[];
  storeId: string;
  storeName?: string;
  id: string;
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
    item: ProfitItem;
    isExpanded: boolean;
    onToggle: () => void;
  }) => {
    return (
      <Card className="overflow-hidden">
        <div
          className={`p-4 ${item.category === "fluid" ? "cursor-pointer" : ""}`}
          onClick={() => item.category === "fluid" && onToggle()}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {item.quantity} units
              </p>
            </div>
            <div className="text-right">
              <div className="font-semibold text-green-600">
                OMR {item.profit.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.profitMargin.toFixed(1)}% margin
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
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t">
            <div>
              <span>Revenue: </span>
              <span className="font-medium">
                OMR {item.totalSales.toFixed(2)}
              </span>
            </div>
            <div>
              <span>Cost: </span>
              <span className="font-medium">
                OMR {item.totalCost.toFixed(2)}
              </span>
            </div>
          </div>

          {item.category === "fluid" && isExpanded && item.variants && (
            <div className="mt-4 border-t pt-4 space-y-3">
              {item.variants.map((variant) => (
                <div
                  key={variant.size}
                  className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded"
                >
                  <div>
                    <span className="font-medium">{variant.size}</span>
                    <p className="text-xs mt-0.5">{variant.quantity} units</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      OMR {variant.profit.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {variant.profitMargin.toFixed(1)}% margin
                    </div>
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
    profitData,
    expandedItems,
    toggleItem,
    visibleColumns,
  }: {
    profitData: ProfitItem[];
    expandedItems: string[];
    toggleItem: (name: string) => void;
    visibleColumns: Record<string, boolean>;
  }) => {
    const totals = useMemo(() => {
      const totalRevenue = profitData.reduce(
        (sum, item) => sum + item.totalSales,
        0,
      );
      const totalCost = profitData.reduce(
        (sum, item) => sum + item.totalCost,
        0,
      );
      const totalProfit = profitData.reduce(
        (sum, item) => sum + item.profit,
        0,
      );
      return { totalRevenue, totalCost, totalProfit };
    }, [profitData]);

    const totalsColSpan =
      1 +
      [
        visibleColumns.shop,
        visibleColumns.quantity,
        visibleColumns.unitCost,
        visibleColumns.unitPrice,
      ].filter(Boolean).length;

    return (
      <div className="relative overflow-x-auto print:overflow-visible">
        <table className="w-full text-sm print:text-xs text-left">
          <thead className="text-xs print:text-[10px] uppercase bg-gray-50 print:bg-transparent">
            <tr>
              <th className="px-6 py-3 print:px-2 print:py-2">Item Name</th>
              {visibleColumns.shop && (
                <th className="px-6 py-3 print:px-2 print:py-2">Shop</th>
              )}
              {visibleColumns.quantity && (
                <th className="px-6 py-3 print:px-2 print:py-2 text-right">
                  Quantity
                </th>
              )}
              {visibleColumns.unitCost && (
                <th className="px-6 py-3 print:px-2 print:py-2 text-right">
                  Unit Cost
                </th>
              )}
              {visibleColumns.unitPrice && (
                <th className="px-6 py-3 print:px-2 print:py-2 text-right">
                  Unit Price
                </th>
              )}
              {visibleColumns.revenue && (
                <th className="px-6 py-3 print:px-2 print:py-2 text-right">
                  Revenue
                </th>
              )}
              {visibleColumns.cost && (
                <th className="px-6 py-3 print:px-2 print:py-2 text-right">
                  Cost
                </th>
              )}
              {visibleColumns.profit && (
                <th className="px-6 py-3 print:px-2 print:py-2 text-right">
                  Profit
                </th>
              )}
              {visibleColumns.margin && (
                <th className="px-6 py-3 print:px-2 print:py-2 text-right">
                  Margin %
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {profitData.map((item) => (
              <React.Fragment key={item.id}>
                <tr
                  className={`border-b ${
                    item.category === "fluid"
                      ? "cursor-pointer hover:bg-gray-50"
                      : ""
                  }`}
                  onClick={() =>
                    item.category === "fluid" && toggleItem(item.id)
                  }
                >
                  <td className="px-6 py-4 print:px-2 print:py-2 font-medium">
                    <span
                      className={
                        item.category === "fluid"
                          ? `${
                              expandedItems.includes(item.id)
                                ? "text-primary"
                                : "text-gray-900"
                            } hover:text-primary transition-colors`
                          : ""
                      }
                    >
                      {item.name}
                    </span>
                  </td>
                  {visibleColumns.shop && (
                    <td className="px-6 py-4 print:px-2 print:py-2">
                      {item.storeName}
                    </td>
                  )}
                  {visibleColumns.quantity && (
                    <td className="px-6 py-4 print:px-2 print:py-2 text-right">
                      {item.quantity} units
                    </td>
                  )}
                  {visibleColumns.unitCost && (
                    <td className="px-6 py-4 print:px-2 print:py-2 text-right">
                      OMR {item.unitCost.toFixed(3)}
                    </td>
                  )}
                  {visibleColumns.unitPrice && (
                    <td className="px-6 py-4 print:px-2 print:py-2 text-right">
                      OMR {item.unitPrice.toFixed(3)}
                    </td>
                  )}
                  {visibleColumns.revenue && (
                    <td className="px-6 py-4 print:px-2 print:py-2 text-right">
                      OMR {item.totalSales.toFixed(2)}
                    </td>
                  )}
                  {visibleColumns.cost && (
                    <td className="px-6 py-4 print:px-2 print:py-2 text-right text-red-600">
                      OMR {item.totalCost.toFixed(2)}
                    </td>
                  )}
                  {visibleColumns.profit && (
                    <td className="px-6 py-4 print:px-2 print:py-2 text-right font-semibold text-green-600">
                      OMR {item.profit.toFixed(2)}
                    </td>
                  )}
                  {visibleColumns.margin && (
                    <td className="px-6 py-4 print:px-2 print:py-2 text-right">
                      <span
                        className={`font-medium ${
                          item.profitMargin >= 40
                            ? "text-green-600"
                            : item.profitMargin >= 30
                              ? "text-yellow-600"
                              : "text-orange-600"
                        }`}
                      >
                        {item.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                  )}
                </tr>
                {item.category === "fluid" &&
                  expandedItems.includes(item.id) &&
                  item.variants?.map((variant) => (
                    <tr
                      key={`${item.id}-${variant.size}`}
                      className="border-b bg-gray-50"
                    >
                      <td className="px-6 py-3 print:px-2 print:py-1 pl-12 print:pl-6 text-sm print:text-[10px] text-gray-600">
                        {variant.size}
                      </td>
                      {visibleColumns.shop && (
                        <td className="px-6 py-3 print:px-2 print:py-1 text-sm print:text-[10px] text-gray-600"></td>
                      )}
                      {visibleColumns.quantity && (
                        <td className="px-6 py-3 print:px-2 print:py-1 text-right text-sm print:text-[10px] text-gray-600">
                          {variant.quantity} units
                        </td>
                      )}
                      {visibleColumns.unitCost && (
                        <td className="px-6 py-3 print:px-2 print:py-1 text-right text-sm print:text-[10px] text-gray-600">
                          OMR {variant.unitCost.toFixed(3)}
                        </td>
                      )}
                      {visibleColumns.unitPrice && (
                        <td className="px-6 py-3 print:px-2 print:py-1 text-right text-sm print:text-[10px] text-gray-600">
                          OMR {variant.unitPrice.toFixed(3)}
                        </td>
                      )}
                      {visibleColumns.revenue && (
                        <td className="px-6 py-3 print:px-2 print:py-1 text-right text-sm print:text-[10px] text-gray-600">
                          OMR {variant.totalSales.toFixed(3)}
                        </td>
                      )}
                      {visibleColumns.cost && (
                        <td className="px-6 py-3 print:px-2 print:py-1 text-right text-sm print:text-[10px] text-red-600">
                          OMR {variant.totalCost.toFixed(3)}
                        </td>
                      )}
                      {visibleColumns.profit && (
                        <td className="px-6 py-3 print:px-2 print:py-1 text-right text-sm print:text-[10px] font-semibold text-green-600">
                          OMR {variant.profit.toFixed(3)}
                        </td>
                      )}
                      {visibleColumns.margin && (
                        <td className="px-6 py-3 print:px-2 print:py-1 text-right text-sm print:text-[10px]">
                          <span
                            className={`font-medium ${
                              variant.profitMargin >= 40
                                ? "text-green-600"
                                : variant.profitMargin >= 30
                                  ? "text-yellow-600"
                                  : "text-orange-600"
                            }`}
                          >
                            {variant.profitMargin.toFixed(1)}%
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
              </React.Fragment>
            ))}
            <tr className="font-semibold text-lg print:text-sm border-t-2">
              <td
                colSpan={totalsColSpan}
                className="px-6 pt-4 print:px-2 print:pt-2"
              >
                Totals
              </td>
              {visibleColumns.revenue && (
                <td className="px-6 pt-4 print:px-2 print:pt-2 text-right">
                  OMR {totals.totalRevenue.toFixed(2)}
                </td>
              )}
              {visibleColumns.cost && (
                <td className="px-6 pt-4 print:px-2 print:pt-2 text-right text-red-600">
                  OMR {totals.totalCost.toFixed(2)}
                </td>
              )}
              {visibleColumns.profit && (
                <td className="px-6 pt-4 print:px-2 print:pt-2 text-right text-green-600">
                  OMR {totals.totalProfit.toFixed(2)}
                </td>
              )}
              {visibleColumns.margin && (
                <td className="px-6 pt-4 print:px-2 print:pt-2 text-right">
                  {totals.totalRevenue > 0
                    ? (
                        (totals.totalProfit / totals.totalRevenue) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </td>
              )}
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
    profitData,
    expandedItems,
    toggleItem,
  }: {
    profitData: ProfitItem[];
    expandedItems: string[];
    toggleItem: (name: string) => void;
  }) => {
    const totals = useMemo(() => {
      const totalRevenue = profitData.reduce(
        (sum, item) => sum + item.totalSales,
        0,
      );
      const totalCost = profitData.reduce(
        (sum, item) => sum + item.totalCost,
        0,
      );
      const totalProfit = profitData.reduce(
        (sum, item) => sum + item.profit,
        0,
      );
      return { totalRevenue, totalCost, totalProfit };
    }, [profitData]);

    return (
      <div className="space-y-4">
        {profitData.map((item) => (
          <MobileItemCard
            key={item.id}
            item={item}
            isExpanded={expandedItems.includes(item.id)}
            onToggle={() => toggleItem(item.id)}
          />
        ))}
        <Card className="p-4 mt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Total Revenue
              </span>
              <span className="font-semibold">
                OMR {totals.totalRevenue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Cost</span>
              <span className="font-semibold text-red-600">
                OMR {totals.totalCost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-lg font-semibold">Net Profit</span>
              <span className="text-lg font-bold text-green-600">
                OMR {totals.totalProfit.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              Margin:{" "}
              {totals.totalRevenue > 0
                ? ((totals.totalProfit / totals.totalRevenue) * 100).toFixed(1)
                : "0.0"}
              %
            </div>
          </div>
        </Card>
      </div>
    );
  },
);
MobileView.displayName = "MobileView";

export default function ProfitsPage() {
  const [selectedStore, setSelectedStore] = useState("all-stores");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
      shop: true,
      quantity: true,
      unitCost: true,
      unitPrice: true,
      revenue: true,
      cost: true,
      profit: true,
      margin: true,
    },
  );

  const toggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  }, []);

  // Date range state
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(1)),
  ); // Start of current month
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { items, stores, isLoading } = useProfitsInfo({
    storeId: selectedStore,
    startDate,
    endDate,
  });

  // Filter items based on selected category and search query (Store is filtered by hook now)
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [isMobileView, setIsMobileView] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    checkViewport();
    window.addEventListener("resize", checkViewport);
    setHasMounted(true);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const toggleItem = useCallback((itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName],
    );
  }, []);

  const CurrentView = useMemo(() => {
    if (isLoading)
      return <div className="p-10 text-center">Loading profits data...</div>;

    if (isMobileView) {
      return (
        <MobileView
          profitData={filteredItems}
          expandedItems={expandedItems}
          toggleItem={toggleItem}
        />
      );
    }
    return (
      <DesktopView
        profitData={filteredItems}
        expandedItems={expandedItems}
        toggleItem={toggleItem}
        visibleColumns={visibleColumns}
      />
    );
  }, [
    isMobileView,
    filteredItems,
    expandedItems,
    toggleItem,
    isLoading,
    visibleColumns,
  ]);

  return (
    <Layout>
      <div className="space-y-6 print:m-0 print:p-0 print:space-y-0">
        <div className="flex items-center gap-4 justify-between print:hidden mt-2">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-semibold">Detailed Profits Report</h1>
          </div>
        </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px]">
                {availableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={visibleColumns[column.id]}
                    onAction={() => toggleColumn(column.id)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <ExportButtons
              className="hidden sm:flex"
              data={filteredItems}
              filename="Profits_Report"
              reportName="Profits Data"
              mapDataFn={(data) => {
                const flatRows: any[] = [];
                data.forEach((item: ProfitItem) => {
                  if (
                    item.category === "fluid" &&
                    item.variants &&
                    item.variants.length > 0
                  ) {
                    item.variants.forEach((variant) => {
                      const row: any = {
                        "Item Name": item.name,
                        "Variant/Size": variant.size,
                      };
                      if (visibleColumns.shop) row["Shop"] = item.storeName;
                      if (visibleColumns.quantity)
                        row["Quantity"] = variant.quantity;
                      if (visibleColumns.unitCost)
                        row["Unit Cost"] = variant.unitCost.toFixed(3);
                      if (visibleColumns.unitPrice)
                        row["Unit Price"] = variant.unitPrice.toFixed(3);
                      if (visibleColumns.revenue)
                        row["Revenue"] = variant.totalSales.toFixed(3);
                      if (visibleColumns.cost)
                        row["Cost"] = variant.totalCost.toFixed(3);
                      if (visibleColumns.profit)
                        row["Net Profit"] = variant.profit.toFixed(3);
                      if (visibleColumns.margin)
                        row["Margin (%)"] = variant.profitMargin.toFixed(1);
                      flatRows.push(row);
                    });
                  } else {
                    const row: any = {
                      "Item Name": item.name,
                      "Variant/Size": "N/A",
                    };
                    if (visibleColumns.shop) row["Shop"] = item.storeName;
                    if (visibleColumns.quantity)
                      row["Quantity"] = item.quantity;
                    if (visibleColumns.unitCost)
                      row["Unit Cost"] = item.unitCost.toFixed(3);
                    if (visibleColumns.unitPrice)
                      row["Unit Price"] = item.unitPrice.toFixed(3);
                    if (visibleColumns.revenue)
                      row["Revenue"] = item.totalSales.toFixed(3);
                    if (visibleColumns.cost)
                      row["Cost"] = item.totalCost.toFixed(3);
                    if (visibleColumns.profit)
                      row["Net Profit"] = item.profit.toFixed(3);
                    if (visibleColumns.margin)
                      row["Margin (%)"] = item.profitMargin.toFixed(1);
                    flatRows.push(row);
                  }
                });
                return flatRows;
              }}
            />
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 xl:justify-between xl:items-end print:hidden mt-4">
          <div className="flex gap-4 flex-col md:flex-row md:items-center w-full xl:w-auto">
            {hasMounted && (
              <>
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
                  
                  <div className="flex md:hidden items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 px-0">
                          <Settings2 className="h-4 w-4" />
                          <span className="sr-only">Columns</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[150px]">
                        {availableColumns.map((column) => (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={visibleColumns[column.id]}
                            onAction={() => toggleColumn(column.id)}
                          >
                            {column.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <ExportButtons
                      data={filteredItems}
                      filename="Profits_Report"
                      mapDataFn={(data) => {
                        const flatRows: any[] = [];
                        data.forEach((item: ProfitItem) => {
                          if (
                            item.category === "fluid" &&
                            item.variants &&
                            item.variants.length > 0
                          ) {
                            item.variants.forEach((variant) => {
                              const row: any = {
                                "Item Name": item.name,
                                "Variant/Size": variant.size,
                              };
                              if (visibleColumns.shop) row["Shop"] = item.storeName;
                              if (visibleColumns.quantity)
                                row["Quantity"] = variant.quantity;
                              if (visibleColumns.unitCost)
                                row["Unit Cost"] = variant.unitCost.toFixed(3);
                              if (visibleColumns.unitPrice)
                                row["Unit Price"] = variant.unitPrice.toFixed(3);
                              if (visibleColumns.revenue)
                                row["Revenue"] = variant.totalSales.toFixed(3);
                              if (visibleColumns.cost)
                                row["Cost"] = variant.totalCost.toFixed(3);
                              if (visibleColumns.profit)
                                row["Net Profit"] = variant.profit.toFixed(3);
                              if (visibleColumns.margin)
                                row["Margin (%)"] = variant.profitMargin.toFixed(1);
                              flatRows.push(row);
                            });
                          } else {
                            const row: any = {
                              "Item Name": item.name,
                              "Variant/Size": "N/A",
                            };
                            if (visibleColumns.shop) row["Shop"] = item.storeName;
                            if (visibleColumns.quantity) row["Quantity"] = item.quantity;
                            if (visibleColumns.unitCost)
                              row["Unit Cost"] = item.unitCost.toFixed(3);
                            if (visibleColumns.unitPrice)
                              row["Unit Price"] = item.unitPrice.toFixed(3);
                            if (visibleColumns.revenue)
                              row["Revenue"] = item.totalSales.toFixed(3);
                            if (visibleColumns.cost)
                              row["Cost"] = item.totalCost.toFixed(3);
                            if (visibleColumns.profit)
                              row["Net Profit"] = item.profit.toFixed(3);
                            if (visibleColumns.margin)
                              row["Margin (%)"] = item.profitMargin.toFixed(1);
                            flatRows.push(row);
                          }
                        });
                        return flatRows;
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 items-center justify-between md:justify-start w-full md:w-auto">
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
                  <div className="hidden md:flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                          <Settings2 className="mr-2 h-4 w-4" />
                          Columns
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[150px]">
                        {availableColumns.map((column) => (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={visibleColumns[column.id]}
                            onAction={() => toggleColumn(column.id)}
                          >
                            {column.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <ExportButtons
                      className="hidden sm:flex"
                      data={filteredItems}
                      filename="Profits_Report"
                      reportName="Profits Data"
                      mapDataFn={(data) => {
                        const flatRows: any[] = [];
                        data.forEach((item: ProfitItem) => {
                          if (
                            item.category === "fluid" &&
                            item.variants &&
                            item.variants.length > 0
                          ) {
                            item.variants.forEach((variant) => {
                              const row: any = {
                                "Item Name": item.name,
                                "Variant/Size": variant.size,
                              };
                              if (visibleColumns.shop) row["Shop"] = item.storeName;
                              if (visibleColumns.quantity)
                                row["Quantity"] = variant.quantity;
                              if (visibleColumns.unitCost)
                                row["Unit Cost"] = variant.unitCost.toFixed(3);
                              if (visibleColumns.unitPrice)
                                row["Unit Price"] = variant.unitPrice.toFixed(3);
                              if (visibleColumns.revenue)
                                row["Revenue"] = variant.totalSales.toFixed(3);
                              if (visibleColumns.cost)
                                row["Cost"] = variant.totalCost.toFixed(3);
                              if (visibleColumns.profit)
                                row["Net Profit"] = variant.profit.toFixed(3);
                              if (visibleColumns.margin)
                                row["Margin (%)"] = variant.profitMargin.toFixed(1);
                              flatRows.push(row);
                            });
                          } else {
                            const row: any = {
                              "Item Name": item.name,
                              "Variant/Size": "N/A",
                            };
                            if (visibleColumns.shop) row["Shop"] = item.storeName;
                            if (visibleColumns.quantity)
                              row["Quantity"] = item.quantity;
                            if (visibleColumns.unitCost)
                              row["Unit Cost"] = item.unitCost.toFixed(3);
                            if (visibleColumns.unitPrice)
                              row["Unit Price"] = item.unitPrice.toFixed(3);
                            if (visibleColumns.revenue)
                              row["Revenue"] = item.totalSales.toFixed(3);
                            if (visibleColumns.cost)
                              row["Cost"] = item.totalCost.toFixed(3);
                            if (visibleColumns.profit)
                              row["Net Profit"] = item.profit.toFixed(3);
                            if (visibleColumns.margin)
                              row["Margin (%)"] = item.profitMargin.toFixed(1);
                            flatRows.push(row);
                          }
                        });
                        return flatRows;
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Showing data for {filteredItems.length} items
          </div>
        </div>

        <Card
          className={`${isMobileView ? "p-4" : "p-6"} print:border-none print:shadow-none print:p-0`}
        >
          <div className="hidden print:block mb-6 pt-4 text-center">
            <h1 className="text-2xl font-bold">Profits Report</h1>
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
