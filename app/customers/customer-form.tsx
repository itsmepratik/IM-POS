"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Plus, Trash2, Car } from "lucide-react"

export interface Vehicle {
  id: string
  make: string
  model: string
  year: string
  licensePlate: string
  vin?: string
  notes?: string
}

export interface CustomerData {
  id: number
  name: string
  email: string
  phone: string
  vehicles: Vehicle[]
  notes?: string
  lastVisit?: string
  address?: string
}

interface CustomerFormProps {
  isOpen: boolean
  onClose: () => void
  customer?: CustomerData
  onSubmit: (customer: Omit<CustomerData, "id" | "lastVisit">) => void
}

export function CustomerForm({ isOpen, onClose, customer, onSubmit }: CustomerFormProps) {
  const [formData, setFormData] = useState<Omit<CustomerData, "id" | "lastVisit">>({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    notes: customer?.notes || "",
    vehicles: customer?.vehicles || []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addVehicle = () => {
    setFormData(prev => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        {
          id: Date.now().toString(),
          make: "",
          model: "",
          year: "",
          licensePlate: ""
        }
      ]
    }))
  }

  const updateVehicle = (id: string, field: keyof Vehicle, value: string) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(vehicle => 
        vehicle.id === id ? { ...vehicle, [field]: value } : vehicle
      )
    }))
  }

  const removeVehicle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(vehicle => vehicle.id !== id)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-[600px] h-[90vh] md:h-auto max-h-[90vh] md:max-h-[85vh] rounded-lg overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(90vh-8rem)] md:max-h-[calc(85vh-8rem)]">
            <div className="px-6 pb-6">
              <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      placeholder="customer@example.com"
                      type="email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea 
                      id="address" 
                      value={formData.address} 
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                      placeholder="Customer address"
                      className="h-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea 
                      id="notes" 
                      value={formData.notes} 
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                      placeholder="Additional notes about the customer"
                      className="h-20"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label>Vehicles ({formData.vehicles.length})</Label>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={addVehicle}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Vehicle
                      </Button>
                    </div>

                    {formData.vehicles.length > 0 ? (
                      <Accordion type="multiple" className="w-full">
                        {formData.vehicles.map((vehicle, idx) => (
                          <AccordionItem key={vehicle.id} value={vehicle.id} className="border rounded-md px-3 my-2">
                            <div className="flex items-center">
                              <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                              <AccordionTrigger className="flex-1 hover:no-underline py-2">
                                <span className="text-sm">
                                  {vehicle.make && vehicle.model ? 
                                    `${vehicle.make} ${vehicle.model} ${vehicle.year}` : 
                                    `Vehicle ${idx + 1}`}
                                </span>
                              </AccordionTrigger>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeVehicle(vehicle.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <AccordionContent className="pb-3 pt-1">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label htmlFor={`make-${vehicle.id}`}>Make</Label>
                                  <Input 
                                    id={`make-${vehicle.id}`} 
                                    value={vehicle.make} 
                                    onChange={(e) => updateVehicle(vehicle.id, "make", e.target.value)} 
                                    placeholder="Toyota"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`model-${vehicle.id}`}>Model</Label>
                                  <Input 
                                    id={`model-${vehicle.id}`} 
                                    value={vehicle.model} 
                                    onChange={(e) => updateVehicle(vehicle.id, "model", e.target.value)} 
                                    placeholder="Camry"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`year-${vehicle.id}`}>Year</Label>
                                  <Input 
                                    id={`year-${vehicle.id}`} 
                                    value={vehicle.year} 
                                    onChange={(e) => updateVehicle(vehicle.id, "year", e.target.value)} 
                                    placeholder="2023"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`license-${vehicle.id}`}>License Plate</Label>
                                  <Input 
                                    id={`license-${vehicle.id}`} 
                                    value={vehicle.licensePlate} 
                                    onChange={(e) => updateVehicle(vehicle.id, "licensePlate", e.target.value)} 
                                    placeholder="ABC-1234"
                                  />
                                </div>
                                <div className="space-y-2 col-span-2">
                                  <Label htmlFor={`vin-${vehicle.id}`}>VIN (Optional)</Label>
                                  <Input 
                                    id={`vin-${vehicle.id}`} 
                                    value={vehicle.vin || ''} 
                                    onChange={(e) => updateVehicle(vehicle.id, "vin", e.target.value)} 
                                    placeholder="Vehicle Identification Number"
                                  />
                                </div>
                                <div className="space-y-2 col-span-2">
                                  <Label htmlFor={`notes-${vehicle.id}`}>Vehicle Notes</Label>
                                  <Textarea 
                                    id={`notes-${vehicle.id}`} 
                                    value={vehicle.notes || ''} 
                                    onChange={(e) => updateVehicle(vehicle.id, "notes", e.target.value)} 
                                    placeholder="Additional information about the vehicle"
                                    className="h-16"
                                  />
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-md">
                        <Car className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No vehicles added yet</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={addVehicle}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Vehicle
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="px-6 py-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="mr-2">Cancel</Button>
          <Button type="submit" form="customer-form">{customer ? "Update" : "Add"} Customer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 