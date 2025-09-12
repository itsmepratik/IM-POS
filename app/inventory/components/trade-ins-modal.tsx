"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Plus, Trash2, Edit3, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { TradeInPrice } from "@/lib/types/trade-in";

interface TradeInItem {
  id: string;
  size: string;
  price: number;
  category: "Scrap" | "Resalable";
}

interface TradeInsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TradeInsModal({ isOpen, onClose }: TradeInsModalProps) {
  const [tradeInItems, setTradeInItems] = useState<TradeInItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newSize, setNewSize] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState<"Scrap" | "Resalable">(
    "Scrap"
  );
  const [filterCategory, setFilterCategory] = useState<"Scrap" | "Resalable">(
    "Scrap"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load trade-in prices from API
  const loadTradeInPrices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/trade-in/prices");
      const data = await response.json();

      if (data.success) {
        const transformedItems: TradeInItem[] = data.data.map(
          (price: TradeInPrice) => ({
            id: price.id,
            size: price.size,
            price: price.tradeInValue,
            category: price.condition,
          })
        );
        setTradeInItems(transformedItems);
      } else {
        toast({
          title: "Error",
          description: "Failed to load trade-in prices",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading trade-in prices:", error);
      toast({
        title: "Error",
        description: "Failed to load trade-in prices",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save trade-in prices to API
  const saveTradeInPrices = async () => {
    setIsSaving(true);
    try {
      const pricesToSave = tradeInItems.map((item) => ({
        size: item.size,
        condition: item.category,
        tradeInValue: item.price,
      }));

      const response = await fetch("/api/trade-in/prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pricesToSave),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        setHasChanges(false);
        // Reload data to get updated IDs
        await loadTradeInPrices();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save trade-in prices",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving trade-in prices:", error);
      toast({
        title: "Error",
        description: "Failed to save trade-in prices",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTradeInPrices();
    }
  }, [isOpen]);

  const handleAddItem = () => {
    if (newSize && newPrice) {
      const newItem: TradeInItem = {
        id: `temp-${Date.now()}`,
        size: newSize,
        price: parseFloat(newPrice),
        category: newCategory,
      };
      setTradeInItems([...tradeInItems, newItem]);
      setNewSize("");
      setNewPrice("");
      setHasChanges(true);
    }
  };

  const handleDeleteItem = (id: string) => {
    setTradeInItems(tradeInItems.filter((item) => item.id !== id));
    setHasChanges(true);
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    setTradeInItems(
      tradeInItems.map((item) =>
        item.id === id ? { ...item, price: newPrice } : item
      )
    );
    setEditingItem(null);
    setHasChanges(true);
  };

  const handleCategoryChange = (
    id: string,
    category: "Scrap" | "Resalable"
  ) => {
    setTradeInItems(
      tradeInItems.map((item) =>
        item.id === id ? { ...item, category } : item
      )
    );
    setHasChanges(true);
  };

  const getBackgroundPosition = () => {
    if (filterCategory === "Scrap") {
      return "left-1";
    }
    if (filterCategory === "Resalable") {
      return "left-1/2";
    }
    return "left-1"; // Default to Scrap
  };

  const filteredItems = tradeInItems.filter(
    (item) => item.category === filterCategory
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[85vh] md:h-[75vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-4 md:p-6 pb-3 md:pb-4 border-b">
          <DialogTitle className="text-lg md:text-xl font-semibold">
            Manage Trade-ins
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-gray-100 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Add New Item Section (Fixed) */}
        <div className="p-4 md:p-6 pb-0 md:pb-0">
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-3 md:p-4">
              <div className="space-y-3 md:space-y-0 md:flex md:items-end md:gap-4">
                <div className="flex-1 space-y-3 md:space-y-0 md:flex md:gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Size
                    </label>
                    <Input
                      placeholder="Enter size (e.g., 1000)"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Price
                    </label>
                    <Input
                      placeholder="Enter price"
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Status
                    </label>
                    <Select
                      value={newCategory}
                      onValueChange={(value: "Scrap" | "Resalable") =>
                        setNewCategory(value)
                      }
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Scrap">Scrap</SelectItem>
                        <SelectItem value="Resalable">Resalable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="md:pt-6 flex gap-2">
                  <Button
                    onClick={handleAddItem}
                    className="w-full md:w-auto rounded-lg bg-blue-600 hover:bg-blue-700"
                    disabled={!newSize || !newPrice}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                  <Button
                    onClick={saveTradeInPrices}
                    className="w-full md:w-auto rounded-lg bg-green-600 hover:bg-green-700"
                    disabled={!hasChanges || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto flex flex-col p-4 md:p-6 pt-0 md:pt-0">
          {/* Filter Switch and Trade-ins Table */}
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
              <h3 className="text-lg font-medium">Trade-in Items</h3>

              {/* Toggle Switch */}
              <div className="flex items-center justify-between md:justify-center">
                <div className="inline-flex items-center rounded-full border p-1 w-fit bg-muted relative">
                  <div
                    className={cn(
                      "absolute inset-y-1 rounded-full transition-all duration-300 ease-in-out shadow-sm bg-white",
                      filterCategory === "Scrap"
                        ? "left-1 w-[calc(50%-4px)]"
                        : "left-1/2 w-[calc(50%-4px)] transform -translate-x-0.5"
                    )}
                  />
                  <button
                    className={`px-4 md:px-6 py-1.5 rounded-full text-sm font-medium relative transition-colors duration-300 ${
                      filterCategory === "Scrap"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setFilterCategory("Scrap")}
                  >
                    Scrap
                  </button>
                  <button
                    className={`px-4 md:px-6 py-1.5 rounded-full text-sm font-medium relative transition-colors duration-300 ${
                      filterCategory === "Resalable"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setFilterCategory("Resalable")}
                  >
                    Resalable
                  </button>
                </div>

                <Badge variant="outline" className="text-sm md:hidden"></Badge>
              </div>

              <Badge
                variant="outline"
                className="text-sm hidden md:block"
              ></Badge>
            </div>

            {/* Items Grid */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Column Headers */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-6 mb-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Size</h4>
                  <Badge variant="secondary" className="text-xs"></Badge>
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Price</h4>
                  <Badge variant="secondary" className="text-xs"></Badge>
                </div>
              </div>

              {/* Scrollable Items Container */}
              <div className="overflow-y-auto flex-1 min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-gray-500 text-sm">
                      Loading trade-in prices...
                    </span>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No {filterCategory} items found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-6"
                      >
                        {/* Size Column Item */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                          <span className="text-sm font-medium text-gray-900">
                            {item.size}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Price Column Item */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                          {editingItem === item.id ? (
                            <div className="flex items-center gap-1 flex-1">
                              <Input
                                type="number"
                                defaultValue={item.price}
                                className="flex-1 h-7 text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdatePrice(
                                      item.id,
                                      parseFloat(e.currentTarget.value)
                                    );
                                  }
                                  if (e.key === "Escape") {
                                    setEditingItem(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingItem(null)}
                                className="h-7 w-7 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 flex-1 justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                ${item.price.toFixed(2)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingItem(item.id)}
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 md:p-6 pt-3 md:pt-4 border-t bg-gray-50/50">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 md:flex-none"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
