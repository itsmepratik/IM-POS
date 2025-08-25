"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Search,
  CreditCard,
  RotateCcw,
  Ticket,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// Import the RefundDialog component
import { RefundDialog, WarrantyDialog } from "./components/refund-dialog";
import { ImportDialog } from "./components/import-dialog";

// Import category components
import { LubricantCategory } from "./components/categories/LubricantCategory";
import { FiltersCategory } from "./components/categories/FiltersCategory";
import { PartsCategory } from "./components/categories/PartsCategory";
import { AdditivesFluidsCategory } from "./components/categories/AdditivesFluidsCategory";

// Import contexts and hooks
import { CategoryProvider, useCategory } from "./context/CategoryContext";
import { CartProvider, useCart } from "./context/CartContext";
import { useCategory as useCategoryHook } from "./hooks/useCategory";
import { useCart as useCartHook } from "./hooks/useCart";

function POSPageContent() {
  const { activeCategory, setActiveCategory } = useCategoryHook();
  const { getItemCount, getTotal } = useCartHook();
  const { toast } = useToast();

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showWarrantyDialog, setShowWarrantyDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Handle import
  const handleImportCustomers = (
    importedData: { id: number; name: string; price: number }[]
  ) => {
    console.log("Importing customer data:", importedData);
    setShowImportDialog(false);
    toast({
      title: "Import successful",
      description: `Imported ${importedData.length} items.`,
    });
  };

  return (
    <Layout>
      <div className="flex h-screen bg-background">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">Point of Sale</h1>
                <Badge variant="secondary" className="text-sm">
                  {getItemCount()} items
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRefundDialog(true)}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refund
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWarrantyDialog(true)}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Warranty
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportDialog(true)}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="border-b bg-card p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Product Categories */}
          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeCategory}
              onValueChange={setActiveCategory}
              className="h-full flex flex-col"
            >
              <div className="border-b bg-card px-4 py-2">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
                  <TabsTrigger value="Lubricants">Lubricants</TabsTrigger>
                  <TabsTrigger value="Filters">Filters</TabsTrigger>
                  <TabsTrigger value="Parts">Parts</TabsTrigger>
                  <TabsTrigger value="Additives & Fluids">
                    Additives & Fluids
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="Lubricants" className="h-full mt-0">
                  <div className="h-full p-4">
                    <LubricantCategory searchQuery={searchQuery} />
                  </div>
                </TabsContent>

                <TabsContent value="Filters" className="h-full mt-0">
                  <div className="h-full p-4">
                    <FiltersCategory searchQuery={searchQuery} />
                  </div>
                </TabsContent>

                <TabsContent value="Parts" className="h-full mt-0">
                  <div className="h-full p-4">
                    <PartsCategory searchQuery={searchQuery} />
                  </div>
                </TabsContent>

                <TabsContent value="Additives & Fluids" className="h-full mt-0">
                  <div className="h-full p-4">
                    <AdditivesFluidsCategory searchQuery={searchQuery} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Cart Sidebar - Simplified for now */}
        <div className="w-96 bg-card border-l p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({getItemCount()})
            </h2>
          </div>

          <div className="space-y-4">
            <div className="text-center text-muted-foreground">
              <p>Cart functionality will be implemented here</p>
              <p className="text-sm mt-2">Total: OMR {getTotal().toFixed(3)}</p>
            </div>

            <Button className="w-full" disabled={getItemCount() === 0}>
              <CreditCard className="h-4 w-4 mr-2" />
              Process Payment ({getItemCount()} items)
            </Button>
          </div>
        </div>

        {/* Refund Dialog */}
        <RefundDialog
          isOpen={showRefundDialog}
          onClose={() => setShowRefundDialog(false)}
        />

        {/* Warranty Dialog */}
        <WarrantyDialog
          isOpen={showWarrantyDialog}
          onClose={() => setShowWarrantyDialog(false)}
        />

        {/* Import Dialog */}
        <ImportDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImportCustomers}
        />
      </div>
    </Layout>
  );
}

export default function POSPage() {
  return (
    <CategoryProvider>
      <CartProvider>
        <POSPageContent />
      </CartProvider>
    </CategoryProvider>
  );
}



