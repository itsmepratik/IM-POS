"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useItems, type Item, type Volume, type BottleStates } from "./items-context"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Minus, Trash2, ImageIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  item?: Item
}

export function ItemModal({ isOpen, onClose, item }: ItemModalProps) {
  const { addItem, updateItem, categories } = useItems()
  const [imageError, setImageError] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Item, "id">>({
    name: "",
    category: "",
    stock: 0,
    price: 0,
    brand: "",
    type: "",
    image: "",
    description: "",
    sku: "",
    isOil: false,
    volumes: [],
    bottleStates: { open: 0, closed: 0 }
  })

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        stock: item.stock,
        price: item.price,
        brand: item.brand || "",
        type: item.type || "",
        image: item.image || "",
        description: item.description || "",
        sku: item.sku || "",
        isOil: item.isOil || false,
        volumes: item.volumes || [],
        basePrice: item.basePrice,
        bottleStates: item.bottleStates || { open: 0, closed: 0 }
      })
    } else {
      setFormData({
        name: "",
        category: "",
        stock: 0,
        price: 0,
        brand: "",
        type: "",
        image: "",
        description: "",
        sku: "",
        isOil: false,
        volumes: [],
        bottleStates: { open: 0, closed: 0 }
      })
    }
  }, [item])

  useEffect(() => {
    if (formData.image && (formData.image.startsWith('http') || formData.image.startsWith('/'))) {
      setImageUrl(formData.image)
      setImageError(false)
    } else {
      setImageUrl(null)
    }
  }, [formData.image])

  useEffect(() => {
    if (!isOpen) {
      setImageError(false)
      setImageUrl(null)
    }
  }, [isOpen])

  // Update stock when bottle quantities change for oil products
  useEffect(() => {
    if (formData.isOil && formData.bottleStates) {
      const totalBottles = formData.bottleStates.open + formData.bottleStates.closed;
      setFormData(prev => ({
        ...prev,
        stock: totalBottles
      }));
    }
  }, [formData.isOil, formData.bottleStates?.open, formData.bottleStates?.closed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // For oil products, update the stock to be the sum of open and closed bottles
    const updatedFormData = { ...formData };
    if (updatedFormData.isOil && updatedFormData.bottleStates) {
      updatedFormData.stock = updatedFormData.bottleStates.open + updatedFormData.bottleStates.closed;
    }
    
    if (item) {
      updateItem(item.id, updatedFormData)
    } else {
      addItem(updatedFormData)
    }
    onClose()
  }

  const addVolume = () => {
    setFormData(prev => ({
      ...prev,
      volumes: [...(prev.volumes || []), { size: "", price: 0 }]
    }))
  }

  const updateVolume = (index: number, field: keyof Volume, value: string | number) => {
    setFormData(prev => {
      const volumes = [...(prev.volumes || [])]
      volumes[index] = { ...volumes[index], [field]: value }
      return { ...prev, volumes }
    })
  }

  const removeVolume = (index: number) => {
    setFormData(prev => ({
      ...prev,
      volumes: (prev.volumes || []).filter((_, i) => i !== index)
    }))
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] h-[95vh] max-h-[95vh] md:max-h-[85vh] md:max-w-2xl rounded-lg overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(95vh-8rem)] md:max-h-[calc(85vh-8rem)]">
            <div className="px-6 pb-6">
              <form id="item-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] border-2 border-border rounded-lg overflow-hidden bg-muted">
                    {!imageError && formData.image ? (
                      <img
                        src={formData.image}
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
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Input
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) })}
                        required
                        disabled={formData.isOil}
                      />
                      {formData.isOil && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Stock is automatically calculated from open and closed bottles
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="image">Image URL</Label>
                      <Input
                        id="image"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="/images/product.jpg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-20"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isOil"
                    checked={formData.isOil}
                    onCheckedChange={(checked) => setFormData({ ...formData, isOil: !!checked })}
                  />
                  <Label htmlFor="isOil">This is an oil product</Label>
                </div>

                {formData.isOil && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="openBottles" className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          Open Bottles
                        </Label>
                        <Input
                          id="openBottles"
                          type="number"
                          min="0"
                          value={formData.bottleStates?.open || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            bottleStates: {
                              ...formData.bottleStates!,
                              open: parseInt(e.target.value) || 0
                            }
                          })}
                          className="border-green-300 focus-visible:ring-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="closedBottles" className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          Closed Bottles
                        </Label>
                        <Input
                          id="closedBottles"
                          type="number"
                          min="0"
                          value={formData.bottleStates?.closed || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            bottleStates: {
                              ...formData.bottleStates!,
                              closed: parseInt(e.target.value) || 0
                            }
                          })}
                          className="border-red-300 focus-visible:ring-red-500"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                      <p className="font-medium mb-1">Bottle States:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><span className="font-medium text-green-700">Open bottles</span> - Bottles that have been opened and are currently in use</li>
                        <li><span className="font-medium text-red-700">Closed bottles</span> - Sealed bottles that haven't been opened yet</li>
                      </ul>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <Label>Available Volumes</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addVolume}
                        className="h-8"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Volume
                      </Button>
                    </div>

                    <ScrollArea className="h-[200px] border rounded-md p-4">
                      <div className="space-y-4">
                        {formData.volumes?.map((volume, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <Input
                              placeholder="Size (e.g., 5L)"
                              value={volume.size}
                              onChange={(e) => updateVolume(index, "size", e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Price"
                              value={volume.price}
                              onChange={(e) => updateVolume(index, "price", Number(e.target.value))}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeVolume(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </form>
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="px-6 py-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="mr-2">Cancel</Button>
          <Button type="submit" form="item-form">{item ? "Update" : "Add"} Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

