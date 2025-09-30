"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useItems } from "./items-context"
import { X, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface BrandModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BrandModal({ open, onOpenChange }: BrandModalProps) {
  const { brands, addBrand, deleteBrand } = useItems()
  const [newBrand, setNewBrand] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAddBrand = async () => {
    if (!newBrand.trim()) return;

    setIsLoading(true);
    try {
      const result = await addBrand(newBrand.trim());
      if (result) {
        toast({
          title: "Brand added",
          description: `${newBrand.trim()} has been added to brands.`,
        });
        setNewBrand("");
      } else {
        toast({
          title: "Error adding brand",
          description: "Failed to add brand. It might already exist.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding brand:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBrand = async (brand: string) => {
    if (!window.confirm(`Are you sure you want to delete "${brand}"? This may affect items assigned to this brand.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await deleteBrand(brand);
      if (success) {
        toast({
          title: "Brand removed",
          description: `${brand} has been removed from brands.`,
        });
      } else {
        toast({
          title: "Error removing brand",
          description: "Could not remove brand. It might be in use by items.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing brand:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Brands</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="new-brand">New Brand</Label>
              <Input
                id="new-brand"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Enter new brand"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddBrand();
                  }
                }}
              />
            </div>
            <Button onClick={handleAddBrand} className="mt-8" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Existing Brands</Label>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              <div className="flex items-center justify-between bg-secondary p-2 rounded-md">
                <span className="text-muted-foreground italic">None (No brand)</span>
                <span className="text-xs italic text-muted-foreground">Default option</span>
              </div>
              {brands.length === 0 ? (
                <p className="text-sm text-muted-foreground">No brands added yet.</p>
              ) : (
                brands.map((brand) => (
                  <div key={brand} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                    <span>{brand}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveBrand(brand)} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}