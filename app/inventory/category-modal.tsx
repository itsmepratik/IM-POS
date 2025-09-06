"use client";

import { useState } from "react";
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
import { useItems } from "./items-context";
import { X, Pencil, Check, XCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryModal({ open, onOpenChange }: CategoryModalProps) {
  const { categories, addCategory, deleteCategory, updateCategory } =
    useItems();
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    setIsLoading(true);
    try {
      let result = await addCategory(newCategory.trim());
      if (result) {
        toast({
          title: "Category added",
          description: `${newCategory.trim()} has been added to categories.`,
        });
        setNewCategory("");
      } else {
        toast({
          title: "Error adding category",
          description: "Failed to add category. It might already exist.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCategory = async (category: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${category}"? This may affect items assigned to this category.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      let success = await deleteCategory(category);
      if (success) {
        toast({
          title: "Category removed",
          description: `${category} has been removed from categories.`,
        });
      } else {
        toast({
          title: "Error removing category",
          description:
            "Could not remove category. It might be in use by items.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing category:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (category: string) => {
    setEditingCategory(category);
    setEditedName(category);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditedName("");
  };

  const saveCategory = async (oldCategory: string) => {
    if (!editedName.trim() || editedName === oldCategory) {
      cancelEditing();
      return;
    }

    setIsLoading(true);
    try {
      const success = await updateCategory(oldCategory, editedName.trim());
      if (success) {
        toast({
          title: "Category updated",
          description: `"${oldCategory}" has been renamed to "${editedName.trim()}".`,
        });
      } else {
        toast({
          title: "Update failed",
          description: "Could not update the category. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Update error",
        description: "An error occurred while updating the category.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setEditingCategory(null);
    }
  };

  // Sort categories alphabetically for a better UX
  const sortedCategories = [...categories].sort((a, b) => a.localeCompare(b));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Add new category section */}
          <div className="space-y-1.5">
            <Label htmlFor="new-category">New Category</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="new-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category name"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCategory();
                  }
                }}
              />
              <Button
                onClick={handleAddCategory}
                disabled={!newCategory.trim() || isLoading}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Existing categories section */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label>Existing Categories</Label>
              <span className="text-xs text-muted-foreground">
                {categories.length} categories
              </span>
            </div>

            {categories.length === 0 ? (
              <div className="flex items-center justify-center p-4 text-center bg-muted/30 rounded-md">
                <div>
                  <AlertCircle className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No categories added yet.
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[280px] border rounded-md p-2">
                <div className="space-y-2 pr-4">
                  {sortedCategories.map((category) => (
                    <div
                      key={category}
                      className={`flex items-center justify-between p-3 rounded-md ${
                        editingCategory === category
                          ? "bg-accent"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      {editingCategory === category ? (
                        <div className="flex items-center space-x-2 flex-grow">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            autoFocus
                            className="h-8 bg-background"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveCategory(category);
                              } else if (e.key === "Escape") {
                                cancelEditing();
                              }
                            }}
                          />
                          <div className="flex">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveCategory(category)}
                              disabled={
                                isLoading ||
                                !editedName.trim() ||
                                editedName === category
                              }
                              className="h-8 px-2"
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                              disabled={isLoading}
                              className="h-8 px-2"
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium truncate">
                            {category}
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(category)}
                              disabled={isLoading || editingCategory !== null}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCategory(category)}
                              disabled={isLoading}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        <DialogFooter>
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
