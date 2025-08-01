"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useItems,
  type Item,
  type Volume,
  type BottleStates,
  type Batch,
} from "./items-context";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Minus,
  Trash2,
  ImageIcon,
  Calendar,
  DollarSign,
  Package,
  Building,
  AlertCircle,
  Pencil,
  Trash2 as Trash2Icon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";

// Extended Item interface to include additional properties needed in the modal
interface ExtendedItem extends Omit<Item, "is_oil" | "image_url"> {
  isOil: boolean; // UI version of is_oil
  imageUrl?: string; // UI version of image_url
  imageBlob?: string;
  notes?: string; // UI version of description
  lowStockAlert?: number;
  cost?: number;
  batches: Batch[]; // Make batches always required and non-optional
}

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item;
}

// Define a type for the tab values
type TabType = "general" | "volumes" | "batches";

export function ItemModal({ open, onOpenChange, item }: ItemModalProps) {
  const {
    addItem,
    updateItem,
    addBatch,
    updateBatch,
    deleteBatch,
    calculateAverageCost,
    categories,
    brands,
    categoryMap,
    brandMap,
  } = useItems();
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [formData, setFormData] = useState<ExtendedItem>({
    id: item?.id || "",
    name: item?.name || "",
    category: item?.category || "",
    stock: item?.stock || 0,
    price: item?.price || 0,
    cost: 0,
    brand: item?.brand || "",
    type: item?.type || "",
    imageUrl: "",
    imageBlob: "",
    notes: "",
    lowStockAlert: 5,
    isOil: item?.is_oil || false,
    bottleStates: item?.bottleStates || { open: 0, closed: 0 },
    volumes: item?.volumes || [],
    batches: item?.batches || [],
  });
  const [newBatch, setNewBatch] = useState<Omit<Batch, "id">>({
    purchaseDate: "",
    costPrice: 0,
    quantity: 0,
    supplier: "",
    expirationDate: "",
  });
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch>({
    id: "",
    purchaseDate: "",
    costPrice: 0,
    quantity: 0,
    supplier: "",
    expirationDate: "",
  });

  // Set mounted state to track when component is mounted on client
  useEffect(() => {
    setIsMounted(true);
    setNewBatch((prev) => ({
      ...prev,
      purchaseDate: format(new Date(), "yyyy-MM-dd"),
    }));
  }, []);

  // Use isMounted to prevent client/server mismatches with random ids
  const getClientOnlyId = useCallback(() => {
    return isMounted ? uuidv4() : "temp-id";
  }, [isMounted]);

  useEffect(() => {
    if (item) {
      // Make sure batches are sorted by date (FIFO order)
      const sortedBatches = [...(item.batches || [])].sort(
        (a, b) =>
          new Date(a.purchase_date || "").getTime() -
          new Date(b.purchase_date || "").getTime()
      );

      // Log the item data to help debug
      console.log("Raw item data from database:", item);

      // Map backend field names to frontend field names
      const formDataObj = {
        id: item.id,
        name: item.name || "",
        category: item.category || "",
        stock: item.stock || 0,
        price: item.price || 0,
        cost: 0, // Default value
        brand: item.brand || "",
        type: item.type || "",
        imageUrl: item.image_url || item.imageUrl || "",
        imageBlob: "",
        notes: item.description || item.notes || "",
        lowStockAlert: item.lowStockAlert || 5, // Use value from item or default to 5
        isOil: item.is_oil || item.isOil || false,
        bottleStates: item.bottleStates || { open: 0, closed: 0 },
        volumes: item.volumes || [],
        batches: sortedBatches || [],
        category_id: item.category_id || null,
        brand_id: item.brand_id || null,
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
        description: item.description || item.notes || null,
        image_url: item.image_url || item.imageUrl || null,
        sku: item.sku || null,
        is_oil: item.is_oil || item.isOil || false,
      };

      console.log("Transformed form data:", {
        ...formDataObj,
        isOil: formDataObj.isOil,
        is_oil: formDataObj.is_oil,
        bottleStates: formDataObj.bottleStates,
        stock: formDataObj.stock,
      });

      setFormData(formDataObj as ExtendedItem);

      // Initialize other state
      if (item.image_url || item.imageUrl) {
        setImageUrl(item.image_url || item.imageUrl || null);
      }
    } else {
      // Default values for a new item
      setFormData({
        id: "",
        name: "",
        category: "",
        stock: 0,
        price: 0,
        cost: 0,
        brand: "",
        type: "",
        imageUrl: "",
        imageBlob: "",
        notes: "",
        lowStockAlert: 5,
        isOil: false,
        bottleStates: { open: 0, closed: 0 },
        volumes: [],
        batches: [],
        category_id: null,
        brand_id: null,
        created_at: null,
        updated_at: null,
        description: null,
        image_url: null,
        sku: null,
        is_oil: false,
      } as ExtendedItem);
    }
    setActiveTab("general");
  }, [item]);

  useEffect(() => {
    if (
      formData.imageUrl &&
      (formData.imageUrl.startsWith("http") ||
        formData.imageUrl.startsWith("/"))
    ) {
      setImageUrl(formData.imageUrl);
      setImageError(false);
    } else {
      setImageUrl(null);
    }
  }, [formData.imageUrl]);

  useEffect(() => {
    if (!open) {
      setImageError(false);
      setImageUrl(null);
    }
  }, [open]);

  // Update stock when bottle quantities change for oil products
  useEffect(() => {
    if (formData.isOil && formData.bottleStates) {
      const totalBottles =
        formData.bottleStates.open + formData.bottleStates.closed;
      setFormData((prev) => ({
        ...prev,
        stock: totalBottles,
      }));
    }
  }, [
    formData.isOil,
    formData.bottleStates?.open,
    formData.bottleStates?.closed,
  ]);

  // Calculate total margin based on batches and price
  const calculateMargin = () => {
    if (
      !formData.batches ||
      formData.batches.length === 0 ||
      formData.price <= 0
    )
      return 0;

    const totalQuantity = formData.batches.reduce(
      (sum, batch) => sum + batch.quantity,
      0
    );
    if (totalQuantity === 0) return 0;

    const weightedCostPrice =
      formData.batches.reduce(
        (sum, batch) => sum + batch.costPrice * batch.quantity,
        0
      ) / totalQuantity;

    const marginPercentage =
      ((formData.price - weightedCostPrice) / formData.price) * 100;
    return Math.round(marginPercentage * 100) / 100; // Round to 2 decimals
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Log the current form data to help with debugging
    console.log("Form data before submission:", formData);

    // For oil products, update the stock to be the sum of open and closed bottles
    const updatedFormData = { ...formData };
    if (updatedFormData.isOil && updatedFormData.bottleStates) {
      // Ensure both UI and backend fields are set
      updatedFormData.is_oil = true;
      const openBottles = updatedFormData.bottleStates.open || 0;
      const closedBottles = updatedFormData.bottleStates.closed || 0;
      updatedFormData.stock = openBottles + closedBottles;

      console.log("Processing oil product:", {
        openBottles,
        closedBottles,
        totalStock: updatedFormData.stock,
        bottleStates: updatedFormData.bottleStates,
      });
    } else if (updatedFormData.batches && updatedFormData.batches.length > 0) {
      // For items with batches, update the stock to be the sum of batch quantities
      updatedFormData.stock = updatedFormData.batches.reduce(
        (sum, batch) => sum + (batch.current_quantity || 0), // Use current_quantity from Batch type
        0
      );
    }

    // Make sure batches are sorted by date (FIFO order)
    if (updatedFormData.batches && updatedFormData.batches.length > 0) {
      updatedFormData.batches = [...updatedFormData.batches].sort(
        (a, b) =>
          new Date(a.purchase_date || "").getTime() - // Use purchase_date from Batch type
          new Date(b.purchase_date || "").getTime()
      );
    }

    // Convert ExtendedItem back to standard Item interface for the context
    // Ensure correct field names mapping between UI and backend
    const itemToSave = {
      id: updatedFormData.id,
      name: updatedFormData.name,
      category: updatedFormData.category,
      stock: updatedFormData.stock,
      price: updatedFormData.price,
      brand: updatedFormData.brand,
      type: updatedFormData.type || null,
      image_url: updatedFormData.imageUrl || null, // Map to backend field name
      description: updatedFormData.notes || null, // Use notes for description
      is_oil: updatedFormData.isOil, // Map to backend field name
      // Explicitly include bottle states for oil products
      bottleStates:
        updatedFormData.isOil && updatedFormData.bottleStates
          ? {
              open: updatedFormData.bottleStates.open || 0,
              closed: updatedFormData.bottleStates.closed || 0,
            }
          : undefined,
      volumes: updatedFormData.isOil ? updatedFormData.volumes : [],
      batches: updatedFormData.batches,
      // Add other fields that might be needed by the backend
      sku: updatedFormData.sku || null,
      category_id: updatedFormData.category_id,
      brand_id: updatedFormData.brand_id,
      // Add low stock threshold
      lowStockAlert: updatedFormData.lowStockAlert || 5,
      // Required fields for a valid Item
      created_at: updatedFormData.created_at || null,
      updated_at: updatedFormData.updated_at || null,
      notes: updatedFormData.notes || null, // Make sure notes is explicitly included
    };

    console.log("Saving item data:", JSON.stringify(itemToSave, null, 2));

    try {
      if (item) {
        // When updating, explicitly log key oil-related fields to help debug
        console.log("Updating existing item:", {
          id: item.id,
          isOil: itemToSave.is_oil,
          bottleStates: itemToSave.bottleStates,
          stock: itemToSave.stock,
          description: itemToSave.description,
          sku: itemToSave.sku,
          category_id: itemToSave.category_id,
          brand_id: itemToSave.brand_id,
        });
        updateItem(item.id, itemToSave);
      } else {
        addItem(itemToSave);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const addVolume = () => {
    setFormData((prev) => ({
      ...prev,
      volumes: [...(prev.volumes || []), { size: "", price: 0 }],
    }));
  };

  const updateVolume = (
    index: number,
    field: keyof Volume,
    value: string | number
  ) => {
    setFormData((prev) => {
      const volumes = [...(prev.volumes || [])];
      volumes[index] = { ...volumes[index], [field]: value };
      return { ...prev, volumes };
    });
  };

  const removeVolume = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      volumes: (prev.volumes || []).filter((_, i) => i !== index),
    }));
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleAddBatch = async () => {
    if (!item) return;

    try {
      // Call the addBatch function and await the result
      const success = await addBatch(item.id, newBatch);

      if (success) {
        // Update local formData state to reflect the new batch
        const newBatchWithId = {
          id: uuidv4(), // Generate a temporary ID for UI purposes
          ...newBatch,
        };

        // Sort batches by purchase date (oldest first) to maintain FIFO order
        const updatedBatches = [
          ...(formData.batches || []),
          newBatchWithId,
        ].sort(
          (a, b) =>
            new Date(a.purchaseDate).getTime() -
            new Date(b.purchaseDate).getTime()
        );

        setFormData((prev) => ({
          ...prev,
          batches: updatedBatches,
          stock: updatedBatches.reduce((sum, batch) => sum + batch.quantity, 0),
        }));

        // Reset the form after successful addition
        setNewBatch({
          purchaseDate: "",
          costPrice: 0,
          quantity: 0,
          supplier: "",
          expirationDate: "",
        });

        setTimeout(() => {
          setNewBatch((prev) => ({
            ...prev,
            purchaseDate: format(new Date(), "yyyy-MM-dd"),
          }));
        }, 0);

        toast({
          title: "Batch added",
          description: "The batch has been added successfully.",
        });
      }
    } catch (error) {
      console.error("Error adding batch:", error);
      toast({
        title: "Error adding batch",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add batch. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBatch = () => {
    if (!item || !editingBatchId) return;

    updateBatch(item.id, editingBatchId, newBatch);

    // Update local formData state to reflect the updated batch
    const currentBatches = formData.batches || [];
    const updatedBatches = currentBatches.map((batch) =>
      batch.id === editingBatchId ? { ...batch, ...newBatch } : batch
    );

    // Re-sort batches by purchase date to maintain FIFO order
    const sortedBatches = updatedBatches.sort(
      (a, b) =>
        new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
    );

    setFormData((prev) => ({
      ...prev,
      batches: sortedBatches,
      stock: sortedBatches.reduce((sum, batch) => sum + batch.quantity, 0),
    }));

    setEditingBatchId(null);
    setNewBatch({
      purchaseDate: "",
      costPrice: 0,
      quantity: 0,
      supplier: "",
      expirationDate: "",
    });
    setTimeout(() => {
      setNewBatch((prev) => ({
        ...prev,
        purchaseDate: format(new Date(), "yyyy-MM-dd"),
      }));
    }, 0);
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!item) return;

    // Show confirmation dialog before deletion
    if (
      !window.confirm(
        "Are you sure you want to delete this batch? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      console.log(
        `Attempting to delete batch ${batchId} for item ${item.id}...`
      );
      const success = await deleteBatch(item.id, batchId);

      if (success) {
        console.log(`Successfully deleted batch ${batchId}`);

        // Update local formData state to reflect the deleted batch
        const currentBatches = formData.batches || [];
        const remainingBatches = currentBatches.filter(
          (batch) => batch.id !== batchId
        );

        setFormData((prev) => ({
          ...prev,
          batches: remainingBatches,
          stock: remainingBatches.reduce(
            (sum, batch) => sum + batch.quantity,
            0
          ),
        }));
      } else {
        console.error(`Failed to delete batch ${batchId}`);
        window.alert(
          "Failed to delete batch. There might be related records or a server issue."
        );
      }
    } catch (error) {
      console.error("Error deleting batch:", error);
      window.alert("An error occurred while deleting the batch.");
    }
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatchId(batch.id);
    setNewBatch({
      purchaseDate: batch.purchaseDate,
      costPrice: batch.costPrice,
      quantity: batch.quantity,
      supplier: batch.supplier || "",
      expirationDate: batch.expirationDate || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingBatchId(null);
    setNewBatch({
      purchaseDate: "",
      costPrice: 0,
      quantity: 0,
      supplier: "",
      expirationDate: "",
    });
    setTimeout(() => {
      setNewBatch((prev) => ({
        ...prev,
        purchaseDate: format(new Date(), "yyyy-MM-dd"),
      }));
    }, 0);
  };

  // Reset to general tab and update active tab if isOil changes
  useEffect(() => {
    // If switching to non-oil but active tab is volumes, reset to general
    if (!formData.isOil && activeTab === "volumes") {
      setActiveTab("general");
    }
  }, [formData.isOil, activeTab]);

  // Calculate the age of a batch in days
  const calculateBatchAge = (purchaseDate: string) => {
    const purchase = new Date(purchaseDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - purchase.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get FIFO order indicator
  const getBatchFifoPosition = (batchIndex: number, totalBatches: number) => {
    if (totalBatches <= 1) return "";
    if (batchIndex === 0) return "Next in line";
    if (batchIndex === totalBatches - 1) return "Last to use";
    return `Position ${batchIndex + 1} of ${totalBatches}`;
  };

  // Use isMounted to prevent hydration mismatch in JSX
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] h-[95vh] max-h-[95vh] md:max-h-[85vh] md:max-w-4xl rounded-lg overflow-hidden flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
          <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {isMounted ? (
            <div className="flex flex-col h-full w-full">
              <div className="px-4 md:px-6">
                <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full justify-start mb-4">
                  <button
                    key="general-tab"
                    type="button"
                    onClick={() => setActiveTab("general")}
                    className={cn(
                      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      activeTab === "general"
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "hover:bg-accent/50"
                    )}
                  >
                    General
                  </button>
                  {formData.isOil && (
                    <button
                      key="volumes-tab"
                      type="button"
                      onClick={() => setActiveTab("volumes")}
                      className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                        activeTab === "volumes"
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "hover:bg-accent/50"
                      )}
                    >
                      Volumes
                    </button>
                  )}
                  <button
                    key="batches-tab"
                    type="button"
                    onClick={() => setActiveTab("batches")}
                    className={cn(
                      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      activeTab === "batches"
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "hover:bg-accent/50"
                    )}
                  >
                    Batches
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-4 pb-20 md:px-6">
                    {activeTab === "general" && (
                      <div className="pb-6 m-0" key="general-content">
                        <form
                          id="item-form"
                          onSubmit={handleSubmit}
                          className="space-y-6"
                        >
                          <div className="flex justify-center">
                            <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] border-2 border-border rounded-lg overflow-hidden bg-muted">
                              {!imageError && formData.imageUrl ? (
                                <img
                                  src={formData.imageUrl}
                                  alt={formData.name || "Product image"}
                                  className="object-contain w-full h-full p-2"
                                  onError={handleImageError}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                  id="name"
                                  value={formData.name}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      name: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="category">Category</Label>
                                <Select
                                  value={formData.category}
                                  onValueChange={(value) => {
                                    // Find the category ID that corresponds to this category name
                                    let categoryId = null;
                                    if (value) {
                                      // Search through the categoryMap for the ID
                                      for (const [id, name] of Object.entries(
                                        categoryMap
                                      )) {
                                        if (name === value) {
                                          categoryId = id;
                                          break;
                                        }
                                      }
                                    }

                                    console.log(
                                      `Selected category: ${value}, ID: ${categoryId}`
                                    );

                                    setFormData({
                                      ...formData,
                                      category: value,
                                      category_id: categoryId,
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem
                                        key={category}
                                        value={category}
                                      >
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="brand">Brand</Label>
                                <Select
                                  value={formData.brand || ""}
                                  onValueChange={(value) => {
                                    // Find the brand ID that corresponds to this brand name
                                    let brandId = null;
                                    if (value && value !== "none") {
                                      // Search through the brandMap for the ID
                                      for (const [id, name] of Object.entries(
                                        brandMap
                                      )) {
                                        if (name === value) {
                                          brandId = id;
                                          break;
                                        }
                                      }
                                    }

                                    console.log(
                                      `Selected brand: ${value}, ID: ${brandId}`
                                    );

                                    setFormData({
                                      ...formData,
                                      brand:
                                        value === "none" ? undefined : value,
                                      brand_id: brandId,
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a brand" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {brands.map((brand) => (
                                      <SelectItem key={brand} value={brand}>
                                        {brand}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="price">Selling Price</Label>
                                <Input
                                  id="price"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.price}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      price: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="stock">Stock</Label>
                                <Input
                                  id="stock"
                                  type="number"
                                  min="0"
                                  value={formData.stock || 0}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      stock: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  required
                                  disabled={
                                    (formData.batches &&
                                      formData.batches.length > 0) ||
                                    formData.isOil // Disable for oil products
                                  }
                                />
                                {formData.batches &&
                                  formData.batches.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Stock is automatically calculated from
                                      batch quantities:{" "}
                                      {formData.batches.reduce(
                                        (sum, batch) =>
                                          sum + (batch.current_quantity || 0),
                                        0
                                      )}{" "}
                                      units
                                    </p>
                                  )}
                              </div>
                              <div>
                                <Label htmlFor="lowStockThreshold">
                                  Low Stock Threshold
                                </Label>
                                <Input
                                  id="lowStockThreshold"
                                  type="number"
                                  min="0"
                                  value={formData.lowStockAlert || 5}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      lowStockAlert:
                                        parseInt(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="type">Type</Label>
                                <Input
                                  id="type"
                                  value={formData.type || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      type: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="image">Image URL</Label>
                            <Input
                              id="image"
                              value={formData.imageUrl}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  imageUrl: e.target.value,
                                })
                              }
                              placeholder="https://example.com/image.jpg or /local-path/image.jpg"
                            />
                          </div>

                          <div>
                            <Label htmlFor="sku">SKU</Label>
                            <Input
                              id="sku"
                              value={formData.sku || ""}
                              onChange={(e) => {
                                console.log("SKU changed:", e.target.value);
                                setFormData({
                                  ...formData,
                                  sku: e.target.value,
                                });
                              }}
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {formData.sku
                                ? `SKU: ${formData.sku}`
                                : "No SKU entered yet"}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={formData.notes || ""}
                              onChange={(e) => {
                                console.log(
                                  "Description changed:",
                                  e.target.value
                                );
                                setFormData({
                                  ...formData,
                                  notes: e.target.value,
                                  description: e.target.value, // Update backend field too
                                });
                              }}
                              rows={3}
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {formData.notes && formData.notes.length > 0
                                ? `Description has ${formData.notes.length} characters`
                                : "No description entered yet"}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isOil"
                              checked={formData.isOil}
                              onCheckedChange={(checked) => {
                                // Log the current state
                                console.log("Oil checkbox change:", {
                                  before: formData.isOil,
                                  after: checked,
                                  formDataBefore: formData,
                                });

                                const isOilChecked = Boolean(checked);

                                // Update both UI and backend fields
                                setFormData({
                                  ...formData,
                                  isOil: isOilChecked,
                                  is_oil: isOilChecked, // Update backend field too

                                  // Initialize bottle states if checked
                                  bottleStates: isOilChecked
                                    ? formData.bottleStates || {
                                        open: 0,
                                        closed: 0,
                                      }
                                    : undefined,

                                  // Initialize volumes if checked
                                  volumes: isOilChecked
                                    ? formData.volumes &&
                                      formData.volumes.length > 0
                                      ? formData.volumes
                                      : [{ size: "", price: 0 }]
                                    : [],

                                  // If oil is checked, stock is calculated from bottle states
                                  stock:
                                    isOilChecked && formData.bottleStates
                                      ? formData.bottleStates.open +
                                        formData.bottleStates.closed
                                      : formData.stock,
                                });

                                // If unchecking and on volumes tab, switch to general
                                if (!checked && activeTab === "volumes") {
                                  setActiveTab("general");
                                }
                              }}
                            />
                            <Label htmlFor="isOil">
                              This is an oil product
                            </Label>
                          </div>

                          {formData.isOil && (
                            <div className="space-y-4 border rounded-md p-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">
                                  Bottle Inventory
                                </h3>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="openBottles">
                                    Open Bottles
                                  </Label>
                                  <Input
                                    id="openBottles"
                                    type="number"
                                    min="0"
                                    value={formData.bottleStates?.open ?? 0}
                                    onChange={(e) => {
                                      const openValue =
                                        parseInt(e.target.value) || 0;
                                      const closedValue =
                                        formData.bottleStates?.closed ?? 0;
                                      const newBottleStates = {
                                        open: openValue,
                                        closed: closedValue,
                                      };

                                      console.log("Updating open bottles:", {
                                        old: formData.bottleStates?.open,
                                        new: openValue,
                                        newBottleStates,
                                        stock: openValue + closedValue,
                                      });

                                      // Update both bottle states and stock
                                      setFormData((prev) => {
                                        const updated = {
                                          ...prev,
                                          bottleStates: newBottleStates,
                                          stock: openValue + closedValue, // Auto-update stock
                                          // Ensure backend fields are also updated for is_oil items
                                          is_oil: prev.isOil, // Keep backend field synced
                                        };
                                        console.log(
                                          "Updated form data:",
                                          updated
                                        );
                                        return updated;
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="closedBottles">
                                    Closed Bottles
                                  </Label>
                                  <Input
                                    id="closedBottles"
                                    type="number"
                                    min="0"
                                    value={formData.bottleStates?.closed ?? 0}
                                    onChange={(e) => {
                                      const closedValue =
                                        parseInt(e.target.value) || 0;
                                      const openValue =
                                        formData.bottleStates?.open ?? 0;
                                      const newBottleStates = {
                                        open: openValue,
                                        closed: closedValue,
                                      };

                                      console.log("Updating closed bottles:", {
                                        old: formData.bottleStates?.closed,
                                        new: closedValue,
                                        newBottleStates,
                                        stock: openValue + closedValue,
                                      });

                                      // Update both bottle states and stock
                                      setFormData((prev) => {
                                        const updated = {
                                          ...prev,
                                          bottleStates: newBottleStates,
                                          stock: openValue + closedValue, // Auto-update stock
                                          // Ensure backend fields are also updated for is_oil items
                                          is_oil: prev.isOil, // Keep backend field synced
                                        };
                                        console.log(
                                          "Updated form data:",
                                          updated
                                        );
                                        return updated;
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </form>
                      </div>
                    )}

                    {activeTab === "volumes" && (
                      <div className="pb-6 m-0" key="volumes-content">
                        {formData.isOil && (
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">Volume Pricing</h3>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={addVolume}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Volume
                                </Button>
                              </div>
                              {formData.volumes &&
                              formData.volumes.length > 0 ? (
                                <div className="space-y-3">
                                  {formData.volumes.map((volume, index) => (
                                    <div
                                      key={index}
                                      className="flex gap-2 items-end"
                                    >
                                      <div className="flex-1">
                                        <Label
                                          htmlFor={`size-${index}`}
                                          className="text-xs"
                                        >
                                          Size
                                        </Label>
                                        <Input
                                          id={`size-${index}`}
                                          value={volume.size}
                                          onChange={(e) =>
                                            updateVolume(
                                              index,
                                              "size",
                                              e.target.value
                                            )
                                          }
                                          placeholder="e.g. 5L, 1L, 500ml"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <Label
                                          htmlFor={`price-${index}`}
                                          className="text-xs"
                                        >
                                          Price
                                        </Label>
                                        <Input
                                          id={`price-${index}`}
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={volume.price}
                                          onChange={(e) =>
                                            updateVolume(
                                              index,
                                              "price",
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeVolume(index)}
                                        className="mb-0.5"
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-24 border border-dashed rounded-lg">
                                  <p className="text-muted-foreground">
                                    No volumes added yet
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "batches" && (
                      <div className="pb-6 m-0" key="batches-content">
                        <div className="space-y-6">
                          {/* FIFO Explanation Banner */}
                          <div className="bg-muted p-3 sm:p-4 rounded-lg flex items-start space-x-3 hidden sm:flex">
                            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium">
                                First In, First Out (FIFO) Inventory
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Batches are automatically sorted by purchase
                                date with oldest batches used first. New batches
                                are only used when older ones are depleted. This
                                helps maintain inventory freshness and accurate
                                cost tracking.
                              </p>
                            </div>
                          </div>

                          {/* Mobile FIFO mini explanation */}
                          <div className="bg-muted p-3 rounded-lg sm:hidden">
                            <p className="text-sm">
                              <span className="font-medium">FIFO:</span> Oldest
                              batches are used first
                            </p>
                          </div>

                          {/* Profit Margin Summary Card */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">
                                Profit Margin
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground mb-1">
                                    Average Cost Price
                                  </div>
                                  <div className="text-2xl font-bold">
                                    {formData.batches &&
                                    formData.batches.length > 0
                                      ? `$${calculateAverageCost(
                                          formData.id
                                        ).toFixed(2)}`
                                      : "$0.00"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground mb-1">
                                    Profit Margin
                                  </div>
                                  <div className="text-2xl font-bold">
                                    {`${calculateMargin()}%`}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Batches List */}
                          <Card>
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  Batches
                                </CardTitle>
                                <CardDescription>
                                  Total Stock:{" "}
                                  {formData.batches.reduce(
                                    (sum, batch) => sum + batch.quantity,
                                    0
                                  )}{" "}
                                  units
                                </CardDescription>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Only use client-side date formatting after component has mounted
                                  setEditingBatch({
                                    id: "",
                                    purchaseDate: isMounted
                                      ? new Date().toISOString().split("T")[0]
                                      : "2023-01-01",
                                    costPrice: 0,
                                    quantity: 0,
                                    supplier: "",
                                    expirationDate: "",
                                  });
                                  setIsEditingBatch(true);
                                }}
                              >
                                Add Batch
                              </Button>
                            </CardHeader>
                            <CardContent className="space-y-2 p-2 sm:p-6">
                              {formData.batches &&
                              formData.batches.length > 0 ? (
                                <div className="space-y-2">
                                  {formData.batches.map((batch, index) => (
                                    <div
                                      key={batch.id}
                                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg"
                                    >
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:flex-1 mb-2 sm:mb-0">
                                        <div>
                                          <div className="text-sm font-medium">
                                            Purchase Date
                                          </div>
                                          <div className="text-sm">
                                            {new Date(
                                              batch.purchaseDate
                                            ).toLocaleDateString()}
                                          </div>
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {calculateBatchAge(
                                              batch.purchaseDate
                                            )}{" "}
                                            days old
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium">
                                            Cost Price
                                          </div>
                                          <div className="text-sm">
                                            $
                                            {typeof batch.costPrice === "number"
                                              ? batch.costPrice.toFixed(2)
                                              : "0.00"}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium">
                                            Quantity
                                          </div>
                                          <div className="text-sm">
                                            {batch.quantity} units
                                          </div>
                                        </div>
                                        <div className="hidden sm:block">
                                          <div className="text-sm font-medium">
                                            FIFO Order
                                          </div>
                                          <div className="text-sm">
                                            {getBatchFifoPosition(
                                              index,
                                              formData.batches.length
                                            )}
                                          </div>
                                        </div>
                                        {index === 0 && (
                                          <div className="col-span-2 sm:hidden">
                                            <div className="text-sm font-medium">
                                              FIFO Order
                                            </div>
                                            <div className="text-sm font-medium text-green-600">
                                              Next in line (will be used first)
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2 ml-auto">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setEditingBatch(batch);
                                            setIsEditingBatch(true);
                                          }}
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            handleDeleteBatch(batch.id);
                                          }}
                                        >
                                          <Trash2Icon className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  No batches added yet. Add a batch to track
                                  inventory and cost price.
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Batch Edit Dialog */}
                          {isEditingBatch && (
                            <Dialog
                              open={isEditingBatch}
                              onOpenChange={() => setIsEditingBatch(false)}
                            >
                              <DialogContent className="w-[92%] max-w-md max-h-[90vh] overflow-y-auto p-3 sm:p-6">
                                <DialogHeader className="p-0 pb-2">
                                  <DialogTitle>
                                    {editingBatch.id
                                      ? "Edit Batch"
                                      : "Add New Batch"}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Manage batch quantities to track stock at
                                    different purchase dates and costs.
                                  </DialogDescription>
                                </DialogHeader>
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    if (editingBatch.id) {
                                      // Update batch in context
                                      updateBatch(
                                        formData.id,
                                        editingBatch.id,
                                        {
                                          purchaseDate:
                                            editingBatch.purchaseDate,
                                          costPrice: editingBatch.costPrice,
                                          quantity: editingBatch.quantity,
                                          supplier: editingBatch.supplier,
                                          expirationDate:
                                            editingBatch.expirationDate,
                                        }
                                      );

                                      // Update local formData
                                      const updatedBatches =
                                        formData.batches.map((batch) =>
                                          batch.id === editingBatch.id
                                            ? {
                                                ...batch,
                                                purchaseDate:
                                                  editingBatch.purchaseDate,
                                                costPrice:
                                                  editingBatch.costPrice,
                                                quantity: editingBatch.quantity,
                                                supplier: editingBatch.supplier,
                                                expirationDate:
                                                  editingBatch.expirationDate,
                                              }
                                            : batch
                                        );

                                      // Re-sort batches by purchase date to maintain FIFO order
                                      const sortedBatches = updatedBatches.sort(
                                        (a, b) =>
                                          new Date(a.purchaseDate).getTime() -
                                          new Date(b.purchaseDate).getTime()
                                      );

                                      setFormData((prev) => ({
                                        ...prev,
                                        batches: sortedBatches,
                                        stock: sortedBatches.reduce(
                                          (sum, batch) => sum + batch.quantity,
                                          0
                                        ),
                                      }));
                                    } else {
                                      // Add new batch to context
                                      addBatch(formData.id, {
                                        purchaseDate: editingBatch.purchaseDate,
                                        costPrice: editingBatch.costPrice,
                                        quantity: editingBatch.quantity,
                                        supplier: editingBatch.supplier,
                                        expirationDate:
                                          editingBatch.expirationDate,
                                      });

                                      // Update local formData
                                      const newBatchWithId = {
                                        id: getClientOnlyId(), // Use stable ID generation function
                                        purchaseDate: editingBatch.purchaseDate,
                                        costPrice: editingBatch.costPrice,
                                        quantity: editingBatch.quantity,
                                        supplier: editingBatch.supplier,
                                        expirationDate:
                                          editingBatch.expirationDate,
                                      };

                                      // Sort batches by purchase date (oldest first) for FIFO
                                      const updatedBatches = [
                                        ...formData.batches,
                                        newBatchWithId,
                                      ].sort(
                                        (a, b) =>
                                          new Date(a.purchaseDate).getTime() -
                                          new Date(b.purchaseDate).getTime()
                                      );

                                      setFormData((prev) => ({
                                        ...prev,
                                        batches: updatedBatches,
                                        stock: updatedBatches.reduce(
                                          (sum, batch) => sum + batch.quantity,
                                          0
                                        ),
                                      }));
                                    }
                                    setIsEditingBatch(false);
                                  }}
                                >
                                  <div className="grid gap-3 py-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                      <Label
                                        htmlFor="purchaseDate"
                                        className="sm:text-right text-sm"
                                      >
                                        Purchase Date
                                      </Label>
                                      <Input
                                        id="purchaseDate"
                                        type="date"
                                        value={editingBatch.purchaseDate}
                                        onChange={(e) =>
                                          setEditingBatch({
                                            ...editingBatch,
                                            purchaseDate: e.target.value,
                                          })
                                        }
                                        className="sm:col-span-3"
                                        required
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                      <Label
                                        htmlFor="costPrice"
                                        className="sm:text-right text-sm"
                                      >
                                        Cost Price
                                      </Label>
                                      <Input
                                        id="costPrice"
                                        type="number"
                                        step="0.01"
                                        value={editingBatch.costPrice}
                                        onChange={(e) =>
                                          setEditingBatch({
                                            ...editingBatch,
                                            costPrice: parseFloat(
                                              e.target.value
                                            ),
                                          })
                                        }
                                        className="sm:col-span-3"
                                        required
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                      <Label
                                        htmlFor="quantity"
                                        className="sm:text-right text-sm"
                                      >
                                        Quantity
                                      </Label>
                                      <div className="sm:col-span-3 space-y-1">
                                        <Input
                                          id="quantity"
                                          type="number"
                                          value={editingBatch.quantity}
                                          onChange={(e) =>
                                            setEditingBatch({
                                              ...editingBatch,
                                              quantity: parseInt(
                                                e.target.value
                                              ),
                                            })
                                          }
                                          required
                                        />
                                        <div className="text-xs text-muted-foreground">
                                          The total stock will update
                                          automatically based on all batch
                                          quantities.
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                      <Label
                                        htmlFor="supplier"
                                        className="sm:text-right text-sm"
                                      >
                                        Supplier
                                      </Label>
                                      <Input
                                        id="supplier"
                                        value={editingBatch.supplier}
                                        onChange={(e) =>
                                          setEditingBatch({
                                            ...editingBatch,
                                            supplier: e.target.value,
                                          })
                                        }
                                        className="sm:col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                      <Label
                                        htmlFor="expirationDate"
                                        className="sm:text-right text-sm"
                                      >
                                        Expiration Date
                                      </Label>
                                      <Input
                                        id="expirationDate"
                                        type="date"
                                        value={editingBatch.expirationDate}
                                        onChange={(e) =>
                                          setEditingBatch({
                                            ...editingBatch,
                                            expirationDate: e.target.value,
                                          })
                                        }
                                        className="sm:col-span-3"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 mt-3">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      onClick={() => setIsEditingBatch(false)}
                                      className="w-full sm:w-auto"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      className="w-full sm:w-auto"
                                    >
                                      Save
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            // Render a simple loading state during SSR to avoid hydration mismatches
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )}
        </div>
        <DialogFooter className="mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {item ? "Update Item" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
