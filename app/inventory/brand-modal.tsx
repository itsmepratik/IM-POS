"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useItems } from "./items-context";
import { X, Loader2, Edit2, Plus, ImageIcon, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import type { Brand } from "@/lib/services/inventoryService";

interface BrandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BrandModal({ open, onOpenChange }: BrandModalProps) {
  const { brandObjects, addBrand, updateBrand, deleteBrand } = useItems();
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandImage, setNewBrandImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Debug: Log brandObjects when modal opens or brandObjects change
  console.log("🔍 BrandModal - brandObjects:", brandObjects);
  console.log(
    "🔍 BrandModal - brandObjects detail:",
    brandObjects.map((b) => ({
      name: b.name,
      image_url: b.image_url,
      images: b.images,
    }))
  );

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      toast({
        title: "Validation Error",
        description: "Brand name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await addBrand({
        name: newBrandName.trim(),
        image_url: newBrandImage.trim() || undefined,
      });

      if (result) {
        setNewBrandName("");
        setNewBrandImage("");
      }
    } catch (error) {
      console.error("Error adding brand:", error);
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    try {
      const success = await updateBrand(editingBrand.id, {
        name: editName.trim(),
        image_url: editImage.trim() || undefined,
      });

      if (success) {
        setEditingBrand(null);
        setEditName("");
        setEditImage("");
      }
    } catch (error) {
      console.error("Error updating brand:", error);
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    try {
      await deleteBrand(brand.id);
    } catch (error) {
      console.error("Error removing brand:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (brand: Brand) => {
    setEditingBrand(brand);
    setEditName(brand.name);
    setEditImage(brand.image_url || "");
  };

  const handleCancelEdit = () => {
    setEditingBrand(null);
    setEditName("");
    setEditImage("");
  };

  const handleImageError = (brandId: string) => {
    setImageErrors((prev) => new Set(prev).add(brandId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Manage Brands
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Add New Brand Section */}
          <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Add New Brand</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="new-brand-image">Image URL (Optional)</Label>
                  <Input
                    id="new-brand-image"
                    value={newBrandImage}
                    onChange={(e) => setNewBrandImage(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddBrand();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleAddBrand}
                  disabled={isLoading || !newBrandName.trim()}
                >
                  {isLoading ? (
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
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>Existing Brands</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({brandObjects.length})
              </span>
            </h3>

            {brandObjects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                    <p>No brands added yet. Add your first brand above.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {brandObjects.map((brand) => (
                  <Card
                    key={brand.id}
                    className={`hover:shadow-md transition-all ${
                      editingBrand?.id === brand.id ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      {editingBrand?.id === brand.id ? (
                        // Edit Mode
                        <div className="space-y-3">
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
                            <Label
                              htmlFor={`edit-image-${brand.id}`}
                              className="text-xs"
                            >
                              Image URL
                            </Label>
                            <Input
                              id={`edit-image-${brand.id}`}
                              value={editImage}
                              onChange={(e) => setEditImage(e.target.value)}
                              placeholder="https://example.com/logo.png"
                              className="h-9"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={handleUpdateBrand}
                              disabled={isLoading}
                              size="sm"
                              className="flex-1"
                            >
                              {isLoading ? (
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
                              {brand.image_url && !imageErrors.has(brand.id) ? (
                                <Image
                                  src={brand.image_url}
                                  alt={brand.name}
                                  fill
                                  sizes="64px"
                                  className="object-contain p-2"
                                  onError={() => handleImageError(brand.id)}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
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
                              disabled={isLoading}
                              className="flex-1"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveBrand(brand)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
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

        <div className="pt-4 border-t flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
