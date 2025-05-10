"use client";

import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Minus,
  Plus,
  History,
  FileText,
  Truck,
  Pencil,
  X,
  ChevronDown,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useTransfer } from "@/hooks/use-transfer";
import { useTransferLocations } from "@/lib/hooks/data/useTransferLocations";

// Define interfaces for our data
interface Location {
  id: string;
  name: string;
}

interface TransferItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  quantity: number;
  price: number;
}

// Define a proper interface for the converted item
interface ConvertedInventoryItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  location: string;
  inStock: number;
  price: number;
}

// Mock interface for sales data
interface SaleItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantitySold: number;
  price: number;
  isOil: boolean;
  volume: string;
}

export default function TransferPage() {
  const { toast } = useToast();
  const { items, refreshItems } = useTransfer(); // Get items from the hook
  const {
    locations,
    categories,
    isLoading: locationsLoading,
    refreshTransferData,
  } = useTransferLocations();
  const [hasMounted, setHasMounted] = useState(false);

  // Use useEffect to refresh items and locations when the component mounts
  useEffect(() => {
    // First clear any cached locations
    if (typeof window !== "undefined") {
      localStorage.removeItem("transferLocations");
    }

    refreshItems();
    refreshTransferData(); // Force refresh locations to ensure we have the latest data
  }, [refreshItems, refreshTransferData]);

  // Separate effect to log locations after they've been updated
  useEffect(() => {
    if (locations.length > 0) {
      console.log("Current locations available:", locations);
    }
  }, [locations]);

  const [sourceLocation, setSourceLocation] = useState<string>("");
  const [destinationLocation, setDestinationLocation] =
    useState<string>("loc0"); // Default to Sanaiya (Main)
  const [generatedSales, setGeneratedSales] = useState<SaleItem[]>([]);
  const [isGeneratingLoading, setIsGeneratingLoading] = useState(false);
  const [confirmGenerateDialogOpen, setConfirmGenerateDialogOpen] =
    useState(false);
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  ); // Today's date by default
  const [transferId, setTransferId] = useState<string>("");
  const [generateSuccess, setGenerateSuccess] = useState(false);

  // Use useEffect to set hasMounted to true after component mounts
  useEffect(() => {
    setHasMounted(true);
    setTransferId(
      `TO-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`
    );
  }, []);

  // Generate sales based on day's transactions
  const generateSales = () => {
    setIsGeneratingLoading(true);

    // Define mock oil products with their volumes
    const mockOils = [
      { name: "Shell HX5 Oil", brand: "Shell", volume: "4L", price: 22.5 },
      { name: "Shell HX5 Oil", brand: "Shell", volume: "5L", price: 27.0 },
      { name: "AC Delco 20W50", brand: "AC Delco", volume: "1L", price: 7.5 },
      { name: "BP 2000 Oil", brand: "BP", volume: "4L", price: 24.1 },
      { name: "Mobco Filter 3", brand: "Mobco", volume: "1L", price: 6.8 },
      {
        name: "Toyota Genuine Oil",
        brand: "Toyota",
        volume: "4L",
        price: 29.45,
      },
      {
        name: "Castrol Engine Oil",
        brand: "Castrol",
        volume: "5L",
        price: 32.0,
      },
      { name: "Valvoline 5W30", brand: "Valvoline", volume: "4L", price: 26.5 },
    ];

    // Mix regular items from inventory with oil products
    setTimeout(() => {
      // Get up to 5 regular items from inventory
      const regularItems = items.slice(0, 5).map((item) => {
        return {
          id: item.id.toString(),
          name: item.name,
          category: typeof item.brand === "string" ? item.brand : "",
          sku: item.sku || "",
          quantitySold: Math.floor(Math.random() * 3) + 1, // Random quantity between 1-3
          price: item.price,
          isOil: false,
          volume: "",
        };
      });

      // Create oil items
      const oilItems = mockOils.slice(0, 7).map((oil, index) => {
        return {
          id: `oil-${index + 1}`,
          name: oil.name,
          category: oil.brand,
          sku: "",
          quantitySold: Math.floor(Math.random() * 3) + 1, // Random quantity between 1-3
          price: oil.price,
          isOil: true,
          volume: oil.volume,
        };
      });

      // Combine regular and oil items
      const mockSales: SaleItem[] = [...oilItems, ...regularItems].slice(0, 12);

      setGeneratedSales(mockSales);
      setIsGeneratingLoading(false);
      setGenerateSuccess(true);

      // Reset success state after 2 seconds
      setTimeout(() => {
        setGenerateSuccess(false);
      }, 2000);

      toast({
        title: "Sales Generated",
        description: `Generated ${mockSales.length} items based on today's sales`,
      });
    }, 1500);
  };

  // Handle target date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetDate(e.target.value);
  };

  // Generate receipt for print view
  const generateReceipt = () => {
    if (generatedSales.length === 0) {
      toast({
        title: "Error",
        description: "No sales data to generate receipt for",
        variant: "destructive",
      });
      return;
    }

    // Add a small delay to ensure the print styles are applied
    setTimeout(() => {
      // Force A4 print format
      document.body.classList.add("print-a4-format");
      window.print();
      // Remove the class after printing
      setTimeout(() => {
        document.body.classList.remove("print-a4-format");
      }, 500);
    }, 100);

    toast({
      title: "Receipt Generated",
      description: "Sales report has been generated for printing",
    });
  };

  return (
    <Layout>
      <div className="space-y-4 print:hidden">
        {/* Title visible on desktop, laptop, and tablet but hidden on mobile */}
        <h2 className="text-2xl font-bold mb-6 hidden sm:block">Transfers</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Container - Location Selection */}
          <Card>
            {/* CardHeader removed */}
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Location</label>
                {hasMounted ? (
                  <Select
                    value={sourceLocation}
                    onValueChange={setSourceLocation}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source location" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Only show Abu Dhurus and Hafith locations */}
                      {locations
                        .filter((location) => {
                          // Only include the two branch locations we need
                          return (
                            location.name === "Abu Dhurus" ||
                            location.name === "Hafith"
                          );
                        })
                        .map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-10 border rounded-md w-full" /> /* Placeholder to maintain layout */
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Destination Location
                </label>
                {hasMounted ? (
                  <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background flex items-center">
                    <span>Sanaiya (Main)</span>
                  </div>
                ) : (
                  <div className="h-10 border rounded-md w-full" /> /* Placeholder to maintain layout */
                )}
              </div>

              {sourceLocation === destinationLocation &&
                sourceLocation &&
                destinationLocation && (
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm">
                    Source and destination cannot be the same location.
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Right Container - Generate Sales */}
          <Card>
            {/* CardHeader removed */}
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Date</label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split("T")[0]} // Limit to today
                  className="w-full"
                />
              </div>

              <div className="pt-4">
                <Button
                  size="lg"
                  className="gap-2 w-full"
                  onClick={() => setConfirmGenerateDialogOpen(true)}
                  disabled={
                    !sourceLocation ||
                    !destinationLocation ||
                    sourceLocation === destinationLocation ||
                    isGeneratingLoading
                  }
                >
                  <ShoppingCart className="h-5 w-5" />
                  Generate Sales for Refill
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated sales display - full width */}
          {generatedSales.length > 0 && (
            <Card className="lg:col-span-2">
              {/* CardHeader removed */}
              <CardContent className="pt-6">
                {/* Desktop view - hidden on mobile */}
                <div className="flex-col h-[400px] hidden md:flex">
                  <div className="flex-grow overflow-auto border rounded-md">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 bg-background z-10">
                        <tr className="bg-muted/50 border-b">
                          <th className="p-3 text-left text-sm font-medium">
                            #
                          </th>
                          <th className="p-3 text-left text-sm font-medium">
                            Item
                          </th>
                          <th className="p-3 text-center text-sm font-medium">
                            Qty
                          </th>
                          <th className="p-3 text-right text-sm font-medium">
                            Unit Price
                          </th>
                          <th className="p-3 text-right text-sm font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedSales.map((item, index) => (
                          <tr
                            key={item.id}
                            className="border-b hover:bg-muted/30"
                          >
                            <td className="p-3 text-sm text-muted-foreground">
                              {index + 1}
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                {item.isOil ? <span>{item.volume}</span> : null}
                                {item.category && (
                                  <>
                                    <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground mx-1"></span>
                                    <span>{item.category}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center font-medium">
                              {item.quantitySold}
                            </td>
                            <td className="p-3 text-right">
                              OMR {item.price.toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-medium">
                              OMR {(item.price * item.quantitySold).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile view - visible only on mobile */}
                <div className="flex flex-col h-[400px] md:hidden">
                  <div className="flex-grow overflow-auto">
                    <ul className="space-y-2">
                      {generatedSales.map((item, index) => (
                        <li
                          key={item.id}
                          className="border rounded-md p-3 bg-white hover:bg-muted/10"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="bg-muted text-muted-foreground text-xs font-medium rounded-full h-6 w-6 flex items-center justify-center">
                                {index + 1}
                              </span>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.isOil ? item.volume : null}
                                  {item.category && (
                                    <span className="ml-1">
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium">
                                {item.quantitySold} × OMR{" "}
                                {item.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                OMR{" "}
                                {(item.price * item.quantitySold).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t sticky bottom-0 bg-background">
                  <Button
                    variant="default"
                    className="gap-2 w-full"
                    onClick={() => {
                      toast({
                        title: "Transfer Submitted",
                        description:
                          "Your transfer has been successfully submitted",
                      });
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Submit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Print-only receipt view */}
      <div className="hidden print:block print:m-0">
        <style jsx global>{`
          @page {
            size: A4;
            margin: 1.5cm;
          }

          body.print-a4-format {
            width: 100% !important;
            min-height: 297mm !important;
          }

          @media print {
            body {
              font-size: 12pt;
              line-height: 1.3;
              width: 100%;
              margin: 0;
              padding: 0;
            }

            html,
            body {
              height: 100%;
              width: 100%;
              margin: 0 !important;
              padding: 0 !important;
            }

            .print-container {
              width: 210mm !important;
              padding: 0 !important;
              margin: 0 auto !important;
              background: white !important;
              box-shadow: none !important;
            }

            table {
              page-break-inside: auto;
              width: 100%;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        `}</style>

        <div className="print-container w-full mx-auto bg-white p-8">
          {/* Header with logo and title */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-center">H AUTOMOTIVES</h1>
            <h2 className="text-xl font-semibold text-center mt-1">
              SALES REPORT FOR REFILL
            </h2>
          </div>

          {/* Report information */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <p className="mb-1">
                <span className="font-semibold inline-block w-24">
                  Report ID:
                </span>
                {transferId}
              </p>
              <p className="mb-1">
                <span className="font-semibold inline-block w-24">Date:</span>
                {new Date(targetDate).toLocaleDateString("en-GB")}
              </p>
              <p className="mb-1">
                <span className="font-semibold inline-block w-24">
                  Generated:
                </span>
                {new Date().toLocaleDateString("en-GB")}{" "}
                {new Date().toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="mb-1">
                <span className="font-semibold inline-block w-24">From:</span>
                {locations.find((l) => l.id === sourceLocation)?.name || "N/A"}
              </p>
              <p className="mb-1">
                <span className="font-semibold inline-block w-24">To:</span>
                {locations.find((l) => l.id === destinationLocation)?.name ||
                  "N/A"}
              </p>
            </div>
          </div>

          {/* Items table */}
          <h3 className="text-lg font-semibold mb-3 border-b pb-1">Items</h3>
          <table className="w-full border-collapse mb-8">
            <thead>
              <tr className="border-b-2 border-gray-400">
                <th className="text-left py-2 px-3 w-[5%]">#</th>
                <th className="text-left py-2 px-3 w-[50%]">Item</th>
                <th className="text-center py-2 px-3 w-[10%]">Qty</th>
                <th className="text-right py-2 px-3 w-[15%]">Unit Price</th>
                <th className="text-right py-2 px-3 w-[20%]">Total</th>
              </tr>
            </thead>
            <tbody>
              {generatedSales.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-600">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      {item.isOil ? <span>{item.volume}</span> : null}
                      {item.category && !item.isOil && (
                        <span>{item.category}</span>
                      )}
                      {item.isOil && item.category && (
                        <>
                          <span className="inline-block w-1 h-1 rounded-full bg-gray-400 mx-1"></span>
                          <span>{item.category}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center">{item.quantitySold}</td>
                  <td className="py-2 px-3 text-right">
                    OMR {item.price.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium">
                    OMR {(item.price * item.quantitySold).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={4}
                  className="py-4 text-right font-bold border-t-2 border-gray-400 px-3"
                >
                  Total Amount:
                </td>
                <td className="py-4 text-right font-bold border-t-2 border-gray-400 px-3">
                  OMR{" "}
                  {generatedSales
                    .reduce(
                      (sum, item) => sum + item.price * item.quantitySold,
                      0
                    )
                    .toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Notes section */}
          <div className="border-t pt-4 mb-4">
            <h3 className="font-semibold mb-2">Notes:</h3>
            <p className="text-sm mb-6">
              This is a computer generated receipt and does not require
              signature.
            </p>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 text-center text-sm text-gray-600">
            <p>H Automotives - Thank you for your business</p>
          </div>
        </div>
      </div>

      {/* Generate Sales Confirmation Dialog */}
      <AlertDialog
        open={confirmGenerateDialogOpen}
        onOpenChange={setConfirmGenerateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Sales Report</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a sales report based on transactions from{" "}
              {new Date(targetDate).toLocaleDateString("en-GB")} for transfer
              from{" "}
              {locations.find((l) => l.id === sourceLocation)?.name ||
                "source location"}{" "}
              to{" "}
              {locations.find((l) => l.id === destinationLocation)?.name ||
                "destination location"}
              . Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmGenerateDialogOpen(false);
                generateSales();
              }}
              disabled={isGeneratingLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isGeneratingLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </div>
              ) : generateSuccess ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Success!</span>
                </div>
              ) : (
                "Generate Sales Report"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
