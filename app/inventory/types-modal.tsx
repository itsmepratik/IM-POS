"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Pencil,
  Check,
  XCircle,
  Plus,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Package,
  Filter,
  Wrench,
  Droplet,
  Loader2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  fetchTypes,
  createType,
  updateType,
  deleteType,
  type Type,
} from "@/lib/services/typesService";
import { fetchCategories, type Category } from "@/lib/services/inventoryService";

interface TypesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Category display info with icons and colors
const CATEGORY_INFO: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  Lubricants: {
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  Filters: {
    icon: Filter,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
  },
  Parts: {
    icon: Wrench,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
  },
  "Additives & Fluids": {
    icon: Droplet,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
};

export function TypesModal({ open, onOpenChange }: TypesModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [newTypeInputs, setNewTypeInputs] = useState<Record<string, string>>({});
  const [editingTypes, setEditingTypes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch categories and types on mount and when modal opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setIsInitialLoading(true);
    try {
      // Fetch categories
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);

      // Fetch all types
      const typesData = await fetchTypes();
      setTypes(typesData);

      // Expand all categories by default
      setExpandedCategories(new Set(categoriesData.map((cat) => cat.id)));
    } catch (error) {
      console.error("Error loading types data:", error);
      toast({
        title: "Error",
        description: "Failed to load types data.",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Get types for a specific category
  const getTypesForCategory = (categoryId: string): Type[] => {
    return types.filter((type) => type.category_id === categoryId);
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    return categories.find((cat) => cat.id === categoryId)?.name || "";
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Handle adding a new type to a category
  const handleAddType = async (categoryId: string) => {
    const newType = newTypeInputs[categoryId]?.trim();
    if (!newType) {
      toast({
        title: "Validation Error",
        description: "Type name is required.",
        variant: "destructive",
      });
      return;
    }

    const categoryTypes = getTypesForCategory(categoryId);
    if (categoryTypes.some((t) => t.name.toLowerCase() === newType.toLowerCase())) {
      toast({
        title: "Duplicate Type",
        description: `"${newType}" already exists in ${getCategoryName(categoryId)}.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const createdType = await createType(categoryId, newType);
      if (createdType) {
        // Refresh types list
        const updatedTypes = await fetchTypes();
        setTypes(updatedTypes);
        setNewTypeInputs({ ...newTypeInputs, [categoryId]: "" });
        toast({
          title: "Type added",
          description: `"${newType}" has been added to ${getCategoryName(categoryId)}.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add type. It may already exist.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding type:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a type from a category
  const handleDeleteType = async (typeId: string, typeName: string, categoryId: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${typeName}" from ${getCategoryName(categoryId)}? This may affect items using this type.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await deleteType(typeId);
      if (success) {
        // Refresh types list
        const updatedTypes = await fetchTypes();
        setTypes(updatedTypes);
        toast({
          title: "Type removed",
          description: `"${typeName}" has been removed from ${getCategoryName(categoryId)}.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Cannot delete type. It may be in use by products.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting type:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing a type
  const startEditingType = (typeId: string, currentName: string) => {
    setEditingTypes({ ...editingTypes, [typeId]: currentName });
  };

  // Cancel editing
  const cancelEditingType = (typeId: string) => {
    const newEditing = { ...editingTypes };
    delete newEditing[typeId];
    setEditingTypes(newEditing);
  };

  // Save edited type
  const saveEditedType = async (typeId: string, oldName: string) => {
    const newType = editingTypes[typeId]?.trim();

    if (!newType || newType === oldName) {
      cancelEditingType(typeId);
      return;
    }

    const type = types.find((t) => t.id === typeId);
    if (!type) {
      cancelEditingType(typeId);
      return;
    }

    const categoryTypes = getTypesForCategory(type.category_id);
    if (
      categoryTypes.some(
        (t) => t.id !== typeId && t.name.toLowerCase() === newType.toLowerCase()
      )
    ) {
      toast({
        title: "Duplicate Type",
        description: `"${newType}" already exists in ${getCategoryName(type.category_id)}.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedType = await updateType(typeId, newType);
      if (updatedType) {
        // Refresh types list
        const updatedTypes = await fetchTypes();
        setTypes(updatedTypes);
        cancelEditingType(typeId);
        toast({
          title: "Type updated",
          description: `"${oldName}" has been renamed to "${newType}".`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update type. It may already exist.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating type:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get sorted categories
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Manage Types</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Manage types for each category. Types are used when adding or editing items.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {isInitialLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading types...</p>
              </div>
            </div>
          ) : (
            <>
              {sortedCategories.map((category) => {
                const categoryTypes = getTypesForCategory(category.id);
                const isExpanded = expandedCategories.has(category.id);
                const categoryInfo = CATEGORY_INFO[category.name] || {
                  icon: Package,
                  color: "text-gray-600",
                  bgColor: "bg-gray-50 border-gray-200",
                };
                const newTypeInput = newTypeInputs[category.id] || "";
                const IconComponent = categoryInfo.icon;

                return (
                  <Card
                    key={category.id}
                    className={cn(
                      "overflow-hidden transition-all",
                      isExpanded && categoryInfo.bgColor
                    )}
                  >
                    <CardHeader
                      className={cn(
                        "cursor-pointer transition-colors pb-3",
                        isExpanded
                          ? "bg-muted/30"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-lg border",
                              categoryInfo.bgColor
                            )}
                          >
                            <IconComponent
                              className={cn("h-5 w-5", categoryInfo.color)}
                            />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold">
                              {category.name}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {categoryTypes.length} type
                              {categoryTypes.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {categoryTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 max-w-xs justify-end">
                              {categoryTypes.slice(0, 3).map((type) => (
                                <Badge
                                  key={type.id}
                                  variant="secondary"
                                  className="text-xs font-medium"
                                >
                                  {type.name}
                                </Badge>
                              ))}
                              {categoryTypes.length > 3 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-medium"
                                >
                                  +{categoryTypes.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="space-y-4 pt-4">
                        {/* Add new type section */}
                        <div className="space-y-2.5 p-4 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
                          <Label
                            htmlFor={`new-type-${category.id}`}
                            className="text-sm font-semibold"
                          >
                            Add New Type
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`new-type-${category.id}`}
                              value={newTypeInput}
                              onChange={(e) =>
                                setNewTypeInputs({
                                  ...newTypeInputs,
                                  [category.id]: e.target.value,
                                })
                              }
                              placeholder="Enter type name"
                              disabled={isLoading}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddType(category.id);
                                }
                              }}
                              className="flex-1 h-9"
                            />
                            <Button
                              onClick={() => handleAddType(category.id)}
                              disabled={!newTypeInput.trim() || isLoading}
                              size="sm"
                              className="h-9"
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4 mr-1.5" />
                              )}
                              Add
                            </Button>
                          </div>
                        </div>

                        {/* Existing types list */}
                        {categoryTypes.length === 0 ? (
                          <div className="flex items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                            <div className="space-y-2">
                              <AlertCircle className="h-5 w-5 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                No types added yet. Add your first type above.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold">
                              Existing Types ({categoryTypes.length})
                            </Label>
                            <div className="space-y-2">
                              {categoryTypes.map((type) => {
                                const isEditing = editingTypes[type.id] !== undefined;
                                const editedValue = editingTypes[type.id] || type.name;

                                return (
                                  <div
                                    key={type.id}
                                    className={cn(
                                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                                      isEditing
                                        ? "bg-accent border-primary shadow-sm"
                                        : "bg-background hover:bg-muted/50 hover:border-muted-foreground/20"
                                    )}
                                  >
                                    {isEditing ? (
                                      <div className="flex items-center gap-2 flex-1">
                                        <Input
                                          value={editedValue}
                                          onChange={(e) =>
                                            setEditingTypes({
                                              ...editingTypes,
                                              [type.id]: e.target.value,
                                            })
                                          }
                                          autoFocus
                                          className="h-8 bg-background flex-1"
                                          disabled={isLoading}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              saveEditedType(type.id, type.name);
                                            } else if (e.key === "Escape") {
                                              cancelEditingType(type.id);
                                            }
                                          }}
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => saveEditedType(type.id, type.name)}
                                          disabled={
                                            isLoading ||
                                            !editedValue.trim() ||
                                            editedValue === type.name
                                          }
                                          className="h-8 px-2 hover:bg-green-50 hover:text-green-600"
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => cancelEditingType(type.id)}
                                          disabled={isLoading}
                                          className="h-8 px-2 hover:bg-red-50 hover:text-red-600"
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <span className="font-medium text-sm truncate flex-1">
                                          {type.name}
                                        </span>
                                        <div className="flex items-center gap-1 ml-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => startEditingType(type.id, type.name)}
                                            disabled={
                                              isLoading ||
                                              Object.keys(editingTypes).length > 0
                                            }
                                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                          >
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleDeleteType(type.id, type.name, category.id)
                                            }
                                            disabled={isLoading}
                                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </>
          )}
        </div>

        <DialogFooter className="pt-4 border-t gap-3 mt-2">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

