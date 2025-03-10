"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useItems } from "./items-context"
import { X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CategoryModal({ isOpen, onClose }: CategoryModalProps) {
  const { categories, addCategory, removeCategory } = useItems()
  const [newCategory, setNewCategory] = useState("")

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim())
      setNewCategory("")
      toast({
        title: "Category added",
        description: `${newCategory.trim()} has been added to categories.`,
      })
    }
  }

  const handleRemoveCategory = (category: string) => {
    removeCategory(category)
    toast({
      title: "Category removed",
      description: `${category} has been removed from categories.`,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="new-category">New Category</Label>
              <Input
                id="new-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category"
              />
            </div>
            <Button onClick={handleAddCategory} className="mt-8">
              Add
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Existing Categories</Label>
            {categories.map((category) => (
              <div key={category} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                <span>{category}</span>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveCategory(category)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

