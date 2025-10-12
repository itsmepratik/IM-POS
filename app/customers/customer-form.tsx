"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, Car, Loader2 } from "lucide-react";
import type { CustomerData, Vehicle } from "@/lib/hooks/data/useCustomers";

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: CustomerData;
  onSubmit: (
    customer: Omit<CustomerData, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  loading?: boolean;
}

// Form data type with address as string for form handling
type CustomerFormData = Omit<
  CustomerData,
  "id" | "createdAt" | "updatedAt" | "address"
> & {
  address: string;
};

export function CustomerForm({
  isOpen,
  onClose,
  customer,
  onSubmit,
  loading = false,
}: CustomerFormProps) {
  console.log("🔄 CustomerForm: Component rendered", {
    isOpen,
    hasCustomer: !!customer,
    customerId: customer?.id,
    loading,
    timestamp: new Date().toISOString(),
  });

  // Helper function to convert address object to string
  const addressToString = (address: any): string => {
    if (!address) return "";
    if (typeof address === "string") return address;
    if (typeof address === "object") {
      // If it's an object, extract the street field or convert to readable format
      if (address.street) return address.street;
      // If it has multiple fields, combine them
      const parts = [
        address.street,
        address.city,
        address.state,
        address.zipCode,
        address.country,
      ].filter(Boolean);
      return parts.join(", ");
    }
    return "";
  };

  // Helper function to convert string back to address object
  const stringToAddress = (addressString: string): any => {
    if (!addressString.trim()) return undefined;
    // For now, store as street field in the address object
    return {
      street: addressString,
      city: undefined,
      state: undefined,
      zipCode: undefined,
      country: undefined,
    };
  };

  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: addressToString(customer?.address),
    notes: customer?.notes || "",
    vehicles: customer?.vehicles || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form data when customer prop changes
  useEffect(() => {
    console.log("🔄 CustomerForm: Customer prop changed", {
      customerId: customer?.id,
      customerName: customer?.name,
      timestamp: new Date().toISOString(),
    });
    setFormData({
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: addressToString(customer?.address),
      notes: customer?.notes || "",
      vehicles: customer?.vehicles || [],
    });
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("📝 CustomerForm: Form submission started", {
      formData: { ...formData, vehicles: formData.vehicles.length },
      isSubmitting,
      timestamp: new Date().toISOString(),
    });

    e.preventDefault();
    if (isSubmitting) {
      console.log("⚠️ CustomerForm: Form already submitting, ignoring");
      return;
    }

    setIsSubmitting(true);
    console.log("🔄 CustomerForm: Set isSubmitting to true");

    try {
      // Convert address string back to object before submitting
      const submissionData = {
        ...formData,
        address: stringToAddress(formData.address as string),
      };
      console.log("📤 CustomerForm: Calling onSubmit with data", {
        submissionData: {
          ...submissionData,
          vehicles: submissionData.vehicles.length,
        },
      });

      await onSubmit(submissionData);
      console.log("✅ CustomerForm: onSubmit completed successfully");

      console.log("🚪 CustomerForm: Calling onClose");
      onClose();
    } catch (error) {
      console.error("❌ CustomerForm: Error submitting form:", error);
    } finally {
      console.log("🔄 CustomerForm: Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  const addVehicle = () => {
    console.log("🚗 CustomerForm: Adding new vehicle", {
      currentVehicleCount: formData.vehicles.length,
      timestamp: new Date().toISOString(),
    });

    setFormData((prev) => {
      const newVehicles = [
        ...prev.vehicles,
        {
          id: Date.now().toString(),
          make: "",
          model: "",
          year: 0,
          plateNumber: "",
        },
      ];
      console.log("🔄 CustomerForm: Vehicle added", {
        newVehicleCount: newVehicles.length,
        newVehicleId: newVehicles[newVehicles.length - 1].id,
      });
      return {
        ...prev,
        vehicles: newVehicles,
      };
    });
  };

  const updateVehicle = (id: string, field: keyof Vehicle, value: string) => {
    console.log("🔧 CustomerForm: Updating vehicle", {
      vehicleId: id,
      field,
      value,
      timestamp: new Date().toISOString(),
    });

    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, [field]: value } : vehicle
      ),
    }));
  };

  const removeVehicle = (id: string) => {
    console.log("🗑️ CustomerForm: Removing vehicle", {
      vehicleId: id,
      currentVehicleCount: formData.vehicles.length,
      timestamp: new Date().toISOString(),
    });

    setFormData((prev) => {
      const newVehicles = prev.vehicles.filter((vehicle) => vehicle.id !== id);
      console.log("🔄 CustomerForm: Vehicle removed", {
        newVehicleCount: newVehicles.length,
      });
      return {
        ...prev,
        vehicles: newVehicles,
      };
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        console.log("🚪 CustomerForm: Dialog onOpenChange", {
          open,
          isOpen,
          timestamp: new Date().toISOString(),
        });
        if (!open) {
          console.log("🚪 CustomerForm: Dialog closing, calling onClose");
          onClose();
        }
      }}
    >
      <DialogContent className="w-[90%] max-w-[600px] max-h-[90vh] rounded-lg overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>
            {customer ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ScrollArea
            className="h-full overflow-auto pr-2"
            style={{ maxHeight: "calc(85vh - 10rem)" }}
          >
            <div className="px-6 pb-6">
              <form
                id="customer-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        console.log("📝 CustomerForm: Name field changed", {
                          newValue: e.target.value,
                          previousValue: formData.name,
                          timestamp: new Date().toISOString(),
                        });
                        setFormData({ ...formData, name: e.target.value });
                      }}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      onChange={(e) => {
                        console.log("📝 CustomerForm: Email field changed", {
                          newValue: e.target.value,
                          previousValue: formData.email,
                          timestamp: new Date().toISOString(),
                        });
                        setFormData({ ...formData, email: e.target.value });
                      }}
                      placeholder="customer@example.com"
                      type="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        console.log("📝 CustomerForm: Phone field changed", {
                          newValue: e.target.value,
                          previousValue: formData.phone,
                          timestamp: new Date().toISOString(),
                        });
                        setFormData({ ...formData, phone: e.target.value });
                      }}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => {
                        console.log("📝 CustomerForm: Address field changed", {
                          newValue: e.target.value,
                          previousValue: formData.address,
                          timestamp: new Date().toISOString(),
                        });
                        setFormData({ ...formData, address: e.target.value });
                      }}
                      placeholder="Customer address"
                      className="h-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => {
                        console.log("📝 CustomerForm: Notes field changed", {
                          newValue: e.target.value,
                          previousValue: formData.notes,
                          timestamp: new Date().toISOString(),
                        });
                        setFormData({ ...formData, notes: e.target.value });
                      }}
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
                          <AccordionItem
                            key={vehicle.id}
                            value={vehicle.id}
                            className="border rounded-md px-3 my-2"
                          >
                            <div className="flex items-center">
                              <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                              <AccordionTrigger className="flex-1 hover:no-underline py-2">
                                <span className="text-sm">
                                  {vehicle.make && vehicle.model
                                    ? `${vehicle.make} ${vehicle.model} ${vehicle.year}`
                                    : `Vehicle ${idx + 1}`}
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
                                  <Label htmlFor={`make-${vehicle.id}`}>
                                    Make
                                  </Label>
                                  <Input
                                    id={`make-${vehicle.id}`}
                                    value={vehicle.make}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "make",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Toyota"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`model-${vehicle.id}`}>
                                    Model
                                  </Label>
                                  <Input
                                    id={`model-${vehicle.id}`}
                                    value={vehicle.model}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "model",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Camry"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`year-${vehicle.id}`}>
                                    Year
                                  </Label>
                                  <Input
                                    id={`year-${vehicle.id}`}
                                    value={vehicle.year}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "year",
                                        e.target.value
                                      )
                                    }
                                    placeholder="2023"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`license-${vehicle.id}`}>
                                    License Plate
                                  </Label>
                                  <Input
                                    id={`license-${vehicle.id}`}
                                    value={vehicle.plateNumber}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "plateNumber",
                                        e.target.value
                                      )
                                    }
                                    placeholder="ABC-1234"
                                  />
                                </div>
                                <div className="space-y-2 col-span-2">
                                  <Label htmlFor={`vin-${vehicle.id}`}>
                                    VIN (Optional)
                                  </Label>
                                  <Input
                                    id={`vin-${vehicle.id}`}
                                    value={vehicle.vin || ""}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "vin",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Vehicle Identification Number"
                                  />
                                </div>
                                <div className="space-y-2 col-span-2">
                                  <Label htmlFor={`notes-${vehicle.id}`}>
                                    Vehicle Notes
                                  </Label>
                                  <Textarea
                                    id={`notes-${vehicle.id}`}
                                    value={vehicle.notes || ""}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "notes",
                                        e.target.value
                                      )
                                    }
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
                        <p className="text-sm text-muted-foreground">
                          No vehicles added yet
                        </p>
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
        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="customer-form"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {customer ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>{customer ? "Update" : "Add"} Customer</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
