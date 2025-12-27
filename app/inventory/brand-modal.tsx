"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useItems } from "./items-context";
import { X, Loader2, Edit2, Plus, ImageIcon, Trash2, ArrowUpDown, Link, Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import type { Brand } from "@/lib/services/inventoryService";
import { ImageUpload } from "./components/image-upload";

interface BrandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BrandModal({ open, onOpenChange }: BrandModalProps) {
  const { brandObjects, addBrand, updateBrand, deleteBrand, refetchItems } = useItems();
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandImage, setNewBrandImage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "image-first" | "image-last">("name-asc");
  
  // Image input tabs
  const [addBrandImageTab, setAddBrandImageTab] = useState<"upload" | "url">("upload");
  const [editBrandImageTab, setEditBrandImageTab] = useState<"upload" | "url">("upload");

  // Helper function to validate if a string is a valid URL
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (trimmed === "") return false;
    try {
      const urlObj = new URL(trimmed);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Sort brands based on selected sort option
  const sortedBrands = useMemo(() => {
    const brands = [...brandObjects];
    switch (sortBy) {
      case "name-asc":
        return brands.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return brands.sort((a, b) => b.name.localeCompare(a.name));
      case "image-first":
        return brands.sort((a, b) => {
          const aHasImage = isValidUrl(a.image_url);
          const bHasImage = isValidUrl(b.image_url);
          if (aHasImage === bHasImage) {
            return a.name.localeCompare(b.name);
          }
          return bHasImage ? 1 : -1;
        });
      case "image-last":
        return brands.sort((a, b) => {
          const aHasImage = isValidUrl(a.image_url);
          const bHasImage = isValidUrl(b.image_url);
          if (aHasImage === bHasImage) {
            return a.name.localeCompare(b.name);
          }
          return aHasImage ? 1 : -1;
        });
      default:
        return brands;
    }
  }, [brandObjects, sortBy]);

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      toast({
        title: "Validation Error",
        description: "Brand name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const result = await addBrand({
        name: newBrandName.trim(),
        image_url: newBrandImage.trim() || undefined,
      });

      if (result) {
        setNewBrandName("");
        setNewBrandImage("");
        setAddBrandImageTab("upload");
        // Refetch brands to get updated list immediately
        await refetchItems();
      }
    } catch (error) {
      console.error("Error adding brand:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateBrand = async () => {
    if (!editingBrand || !editName.trim()) {
      toast({
        title: "Validation Error",
        description: "Brand name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const success = await updateBrand(editingBrand.id, {
        name: editName.trim(),
        image_url: editImage.trim() || null,
      });

      if (success) {
        setEditingBrand(null);
        setEditName("");
        setEditImage("");
        setEditBrandImageTab("upload");
        // Refetch brands to get updated list immediately
        await refetchItems();
      }
    } catch (error) {
      console.error("Error updating brand:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveBrand = async (brand: Brand) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${brand.name}"? This may affect items assigned to this brand.`
      )
    ) {
      return;
    }

    setDeletingId(brand.id);
    try {
      await deleteBrand(brand.id);
      // Refetch brands to get updated list immediately
      await refetchItems();
    } catch (error) {
      console.error("Error removing brand:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (brand: Brand) => {
    setEditingBrand(brand);
    setEditName(brand.name);
    setEditImage(brand.image_url || "");
    setEditBrandImageTab("upload");
  };

  const handleCancelEdit = () => {
    setEditingBrand(null);
    setEditName("");
    setEditImage("");
    setEditBrandImageTab("upload");
  };

  const handleImageError = (brandId: string) => {
    setImageErrors((prev) => new Set(prev).add(brandId));
  };

  // Reset image errors when modal opens
  useEffect(() => {
    if (open) {
      setImageErrors(new Set());
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Manage Brands
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 px-4 pr-2 pb-4">
          {/* Add New Brand Section */}
          <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Add New Brand</h3>
              </div>
              <div className="flex flex-col gap-5">
                <div className="space-y-2">
                  <Label htmlFor="new-brand-name">Brand Name *</Label>
                  <Input
                    id="new-brand-name"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="e.g., Toyota, Honda, etc."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddBrand();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-brand-image">Brand Image (Optional)</Label>
                    <div className="flex bg-muted rounded-md p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setAddBrandImageTab("upload")}
                        className={`text-xs px-2 py-0.5 rounded-sm transition-all ${
                          addBrandImageTab === "upload" 
                            ? "bg-background shadow-sm text-foreground font-medium" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddBrandImageTab("url")}
                        className={`text-xs px-2 py-0.5 rounded-sm transition-all ${
                          addBrandImageTab === "url" 
                            ? "bg-background shadow-sm text-foreground font-medium" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        URL
                      </button>
                    </div>
                  </div>
                  
                  {addBrandImageTab === "upload" ? (
                    <ImageUpload
                      value={newBrandImage}
                      onUpload={(url) => setNewBrandImage(url)}
                      onRemove={() => setNewBrandImage("")}
                      bucketName="Brand Images"
                      folderName="brands"
                      className="h-36" // Increased from h-32 for better visibility
                    />
                  ) : (
                    <div className="relative">
                      <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-brand-image"
                        value={newBrandImage}
                        onChange={(e) => setNewBrandImage(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="pl-9"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddBrand();
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleAddBrand}
                  disabled={isAdding || !newBrandName.trim()}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Brand
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Brands Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span>Existing Brands</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({sortedBrands.length})
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select 
                  value={sortBy} 
                  onValueChange={(value: "name-asc" | "name-desc" | "image-first" | "image-last") => setSortBy(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="image-first">With Images First</SelectItem>
                    <SelectItem value="image-last">Without Images First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {sortedBrands.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                    <p>No brands added yet. Add your first brand above.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
                {sortedBrands.map((brand) => (
                  <Card
                    key={brand.id}
                    className={`hover:shadow-md transition-all ${
                      editingBrand?.id === brand.id ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      {editingBrand?.id === brand.id ? (
                        // Edit Mode
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label
                              htmlFor={`edit-name-${brand.id}`}
                              className="text-xs"
                            >
                              Brand Name
                            </Label>
                            <Input
                              id={`edit-name-${brand.id}`}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Brand name"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor={`edit-image-${brand.id}`}
                                className="text-xs"
                              >
                                Brand Image
                              </Label>
                              <div className="flex bg-muted rounded-md p-0.5 gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => setEditBrandImageTab("upload")}
                                  className={`text-[10px] px-1.5 py-0.5 rounded-sm transition-all ${
                                    editBrandImageTab === "upload" 
                                      ? "bg-background shadow-sm text-foreground font-medium" 
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  Upload
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditBrandImageTab("url")}
                                  className={`text-[10px] px-1.5 py-0.5 rounded-sm transition-all ${
                                    editBrandImageTab === "url" 
                                      ? "bg-background shadow-sm text-foreground font-medium" 
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  URL
                                </button>
                              </div>
                            </div>
                            
                            {editBrandImageTab === "upload" ? (
                              <ImageUpload
                                value={editImage}
                                onUpload={(url) => setEditImage(url)}
                                onRemove={() => setEditImage("")}
                                bucketName="Brand Images"
                                folderName="brands"
                                className="h-32" // Increased from h-24 to prevent clipping and show icon/text clearly
                              />
                            ) : (
                              <div className="relative">
                                <Link className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                                <Input
                                  id={`edit-image-${brand.id}`}
                                  value={editImage}
                                  onChange={(e) => setEditImage(e.target.value)}
                                  placeholder="https://example.com/logo.png"
                                  className="h-8 text-xs pl-8"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={handleUpdateBrand}
                              disabled={isUpdating}
                              size="sm"
                              className="flex-1"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            {/* Brand Image */}
                            <div className="relative w-16 h-16 rounded-lg border-2 bg-muted overflow-hidden flex-shrink-0">
                              {(() => {
                                const imageUrl = brand.image_url?.trim();
                                const hasValidUrl = isValidUrl(imageUrl) && !imageErrors.has(brand.id);
                                
                                if (hasValidUrl && imageUrl) {
                                  return (
                                    <Image
                                      src={imageUrl}
                                      alt={brand.name}
                                      fill
                                      sizes="64px"
                                      className="object-contain p-2"
                                      onError={() => handleImageError(brand.id)}
                                      unoptimized
                                    />
                                  );
                                }
                                
                                return (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Brand Info */}
                            <div className="flex-1 min-w-0">
                              <h4
                                className="font-semibold text-base truncate"
                                title={brand.name}
                              >
                                {brand.name}
                              </h4>
                              {brand.image_url && (
                                <p
                                  className="text-xs text-muted-foreground truncate mt-1"
                                  title={brand.image_url}
                                >
                                  {brand.image_url}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(brand)}
                              disabled={isUpdating || deletingId !== null}
                              className="flex-1"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveBrand(brand)}
                              disabled={isUpdating || deletingId !== null}
                            >
                              {deletingId === brand.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Default "None" Option Info */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-orange-900">
                    Default Option
                  </h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Items without a specific brand will be listed under "None
                    (No brand)". This is a default option and cannot be deleted.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="pt-4 mt-2 border-t flex justify-end">
          <Button 
            onClick={() => onOpenChange(false)} 
            variant="outline"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
