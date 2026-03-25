"use client";

import { useState, useTransition, useMemo } from "react";
import { submitPurchaseOrder } from "@/app/actions/purchase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Plus,
  Search,
  Trash2,
  PackagePlus,
  ArrowRight,
  CheckCircle2,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  costPrice: string | null;
  imageUrl?: string | null;
  brandName?: string | null;
}

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  brandName?: string | null;
  imageUrl?: string | null;
  quantity: number;
  costPrice: number;
}

export function PurchaseOrdersClient({
  locations,
  products,
}: {
  locations: Location[];
  products: Product[];
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [locationId, setLocationId] = useState<string>("");
  const [supplier, setSupplier] = useState<string>("");

  const [items, setItems] = useState<OrderItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];

    // Split the query into distinct search terms
    const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);

    return products
      .filter((p) => {
        // Build a complete searchable string: "mopar 5w-30 usa <id>"
        const searchableString = `
          ${p.name} 
          ${p.brandName || ""} 
          ${p.id}
        `.toLowerCase();

        // Ensure EVERY term in the query exists SOMEWHERE in the searchable string
        // This allows "mopar 5w-30" to match even if name is "5W-30 (USA)" and brand is "Mopar"
        return queryTerms.every((term) => searchableString.includes(term));
      })
      .slice(0, 15);
  }, [searchQuery, products]);

  const handleAddProduct = (product: Product) => {
    // Check if already in order
    const exists = items.find((i) => i.productId === product.id);
    if (exists) {
      toast({
        title: "Product already added",
        description: "Please adjust the quantity in the list below.",
      });
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        quantity: 1,
        costPrice: product.costPrice ? parseFloat(product.costPrice) : 0,
      },
    ]);
  };

  const handleUpdateItem = (
    id: string,
    field: keyof OrderItem,
    value: number,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalCost = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity * item.costPrice, 0);
  }, [items]);

  const handleSubmit = () => {
    if (!locationId) {
      toast({
        title: "Error",
        description: "Destination branch is required",
        variant: "destructive",
      });
      return;
    }
    if (!supplier) {
      toast({
        title: "Error",
        description: "Supplier is required",
        variant: "destructive",
      });
      return;
    }
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one product",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await submitPurchaseOrder(locationId, supplier, items);

      if (result.success) {
        toast({
          title: "Purchase Order Created",
          description: `Successfully added ${items.length} items to inventory.`,
          variant: "default",
        });
        // Reset form
        setItems([]);
        setSupplier("");
      } else {
        toast({
          title: "Failed to create PO",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {/* LEFT COLUMN: Configuration */}
      <div className="md:col-span-1 space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PackagePlus className="h-5 w-5 text-primary" />
              Order Configuration
            </CardTitle>
            <CardDescription>Set supplier and destination</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="supplier"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Supplier / Vendor
              </Label>
              <Input
                id="supplier"
                placeholder="e.g. Toyota Genuine Parts Ltd."
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="location"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Destination Branch
              </Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger id="location" className="h-11">
                  <SelectValue placeholder="Select destination..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-primary mb-1">
              Order Summary
            </div>
            <div className="text-3xl font-bold tracking-tight">
              OMR {totalCost.toFixed(3)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {items.length} items to be received
            </div>

            <Button
              className="w-full mt-6 h-12 text-md font-medium shadow-md transition-all hover:scale-[1.02]"
              size="lg"
              disabled={isPending || items.length === 0}
              onClick={handleSubmit}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Confirm & Process
                  Order
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: Items List */}
      <div className="md:col-span-2 space-y-4">
        <Card className="border-border shadow-sm min-h-[500px] flex flex-col">
          <CardHeader className="bg-muted/30 border-b pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Product Lines</CardTitle>
              <CardDescription>Select products to restock</CardDescription>
            </div>
            <div className="relative w-full md:w-[400px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search and add product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearching(true)}
                  onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                  className="pl-9 h-10 w-full bg-background border-primary/20 hover:border-primary/40 focus-visible:ring-primary/20 transition-colors"
                />
              </div>

              {isSearching && searchQuery.trim() !== "" && (
                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg overflow-hidden max-h-[300px] overflow-y-auto animate-in fade-in-0 zoom-in-95">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-sm text-center text-muted-foreground">
                      No product found.
                    </div>
                  ) : (
                    <div
                      className="py-1"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30 sticky top-0 z-10">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                          {filteredProducts.length} Results
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            filteredProducts.forEach((p) => {
                              if (!items.some((i) => i.productId === p.id)) {
                                handleAddProduct(p);
                              }
                            });
                            // We close it after Add All
                            setSearchQuery("");
                            setIsSearching(false);
                          }}
                        >
                          Add All
                        </Button>
                      </div>

                      {filteredProducts.map((product) => {
                        const isAdded = items.some(
                          (i) => i.productId === product.id,
                        );
                        return (
                          <button
                            key={product.id}
                            type="button"
                            className={cn(
                              "w-full text-left px-4 py-2 hover:bg-muted text-sm flex justify-between items-center transition-colors border-b last:border-0 border-border/50 relative",
                              isAdded && "opacity-60 bg-muted/50",
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isAdded) {
                                handleAddProduct(product);
                              }
                            }}
                          >
                            <div className="flex items-center flex-1 min-w-0 pr-4">
                              {/* Product Image Thumbnail */}
                              <div className="flex-shrink-0 w-8 h-8 rounded bg-muted/50 overflow-hidden flex items-center justify-center mr-3 border border-border/50">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground/50" />
                                )}
                              </div>
                              <div className="block truncate text-left">
                                <span className="block truncate font-medium">
                                  {product.name}
                                </span>
                                {product.brandName && (
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {product.brandName}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center shrink-0 ml-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap bg-background rounded-sm px-1.5 py-0.5 border shadow-sm">
                                OMR{" "}
                                {parseFloat(product.costPrice || "0").toFixed(
                                  3,
                                )}
                              </span>
                              {isAdded && (
                                <CheckCircle2 className="h-4 w-4 ml-3 text-primary shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-auto">
            {items.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">
                  No products added yet
                </h3>
                <p className="text-sm max-w-[250px]">
                  Search and add products to begin building this purchase order.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-muted/10 transition-colors group"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium text-muted-foreground shrink-0 hidden sm:flex">
                      {index + 1}
                    </div>

                    <div className="flex-shrink-0 w-10 h-10 rounded bg-muted/50 overflow-hidden flex items-center justify-center border border-border/50">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-medium text-sm sm:text-base truncate"
                        title={
                          item.brandName
                            ? `${item.brandName} ${item.name}`
                            : item.name
                        }
                      >
                        {item.brandName ? (
                          <span className="font-semibold text-primary/80 mr-1">
                            {item.brandName}
                          </span>
                        ) : null}
                        {item.name}
                      </h4>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                      {/* Quantity */}
                      <div className="w-24">
                        <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
                          Qty
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "quantity",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="h-9 font-mono"
                        />
                      </div>

                      {/* Cost per unit */}
                      <div className="w-28">
                        <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
                          Cost (OMR)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.costPrice}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "costPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-9 font-mono"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="w-24 text-right pt-4 sm:pt-0">
                        <Label className="text-[10px] uppercase text-muted-foreground mb-1 block sm:hidden">
                          Total
                        </Label>
                        <div className="font-medium text-sm">
                          {(item.quantity * item.costPrice).toFixed(3)}
                        </div>
                      </div>

                      {/* Remove */}
                      <div className="pt-4 sm:pt-0 ml-auto sm:ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-all"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
