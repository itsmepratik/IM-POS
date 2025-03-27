"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useItems } from "./items-context"
import { X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface BrandModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BrandModal({ open, onOpenChange }: BrandModalProps) {
  const { brands, addBrand, deleteBrand } = useItems()
  const [newBrand, setNewBrand] = useState("")

  const handleAddBrand = () => {
    if (newBrand.trim()) {
      addBrand(newBrand.trim())
      setNewBrand("")
      toast({
        title: "Brand added",
        description: `${newBrand.trim()} has been added to brands.`,
      })
    }
  }

  const handleRemoveBrand = (brand: string) => {
    deleteBrand(brand)
    toast({
      title: "Brand removed",
      description: `${brand} has been removed from brands.`,
    })
  }

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
            <Button onClick={handleAddBrand} className="mt-8">
              Add
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
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveBrand(brand)}>
                      <X className="h-4 w-4" />
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