"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Eraser, Car, Trash2 } from "lucide-react";
import { CustomerData, Vehicle } from "@/lib/services/customerService";
import { customerService } from "@/lib/services/customerService";

export interface POSCustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: CustomerData) => void;
  onSkip: () => void;
  setCurrentCustomer: (customer: CustomerData) => void;
}

export function POSCustomerForm({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  setCurrentCustomer,
}: POSCustomerFormProps) {
  const [formData, setFormData] = useState<
    Omit<CustomerData, "id" | "lastVisit">
  >({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    vehicles: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [existingCustomers, setExistingCustomers] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      displayText: string;
    }>
  >([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  // Fetch existing customers for dropdown
  const fetchCustomers = useCallback(async (search: string = "") => {
    setIsLoadingCustomers(true);
    try {
      const response = await fetch(
        `/api/customers/dropdown?search=${encodeURIComponent(search)}&limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        const sortedCustomers = (data.customers || []).sort((a: { displayText?: string }, b: { displayText?: string }) => 
          (a.displayText || "").localeCompare(b.displayText || "")
        );
        setExistingCustomers(sortedCustomers);
      }
    } catch (error) {
      // Error silently handled - customers dropdown will be empty
      void error;
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  // Handle customer selection from dropdown
  const handleCustomerSelect = useCallback(
    async (customerId: string) => {

      if (!customerId || customerId === "new-customer") {
        setSelectedCustomerId("");
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          notes: "",
          vehicles: [],
        });
        return;
      }

      try {
        const response = await fetch(`/api/customers/${customerId}`);
        if (response.ok) {
          const responseData = await response.json();
          const customer = responseData.customer;

          if (!customer || !customer.id) {
            return;
          }

          setSelectedCustomerId(customer.id);
          // Set currentCustomer with the full customer data including id
          const fullCustomerData: CustomerData = {
            id: customer.id,
            name: customer.name || "",
            email: customer.email || "",
            phone: customer.phone || "",
            address: customer.address || "",
            notes: customer.notes || "",
            vehicles: customer.vehicles || [],
            lastVisit: new Date().toISOString(), // Set a default last visit as ISO string
          };
          setCurrentCustomer(fullCustomerData);
          setFormData({
            name: customer.name || "",
            email: customer.email || "",
            phone: customer.phone || "",
            address: customer.address || "",
            notes: customer.notes || "",
            vehicles: customer.vehicles || [],
          });
        }
      } catch (error) {
        // Error silently handled
        void error;
      }
    },
    [setCurrentCustomer]
  );

  // Load customers when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen, fetchCustomers]);

  // Search customers with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearchTerm !== undefined) {
        fetchCustomers(customerSearchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearchTerm, fetchCustomers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      let customerData;

      if (selectedCustomerId) {
        // Use existing customer - fetch fresh data to ensure we have the ID
        const response = await fetch(`/api/customers/${selectedCustomerId}`);
        if (response.ok) {
          const responseData = await response.json();
          // Extract the customer object from the response
          customerData = responseData.customer;
        } else {
          throw new Error("Failed to fetch existing customer");
        }
      } else {
        // Create new customer
        customerData = await customerService.createCustomer({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes,
          vehicles: formData.vehicles.map((v) => ({
            make: v.make,
            model: v.model,
            year: v.year,
            licensePlate: v.licensePlate,
            color: v.color || "",
            engineType: v.engineType || "",
            notes: v.notes || "",
          })),
        });
      }

      if (customerData && customerData.id) {
        // Set currentCustomer with the returned data that includes id
        setCurrentCustomer(customerData);
        onSubmit(customerData);
      } else {
        throw new Error("Failed to handle customer - missing customer ID");
      }
    } catch (error) {
      // Error is already handled by the service with toast
      void error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVehicle = () => {
    setFormData((prev) => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        {
          id: Date.now().toString(),
          make: "",
          model: "",
          year: "",
          licensePlate: "",
        },
      ],
    }));
  };

  const updateVehicle = (id: string, field: keyof Vehicle, value: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, [field]: value } : vehicle
      ),
    }));
  };

  const removeVehicle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((vehicle) => vehicle.id !== id),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-[600px] max-h-[85vh] rounded-lg flex flex-col overflow-hidden">
        <DialogHeader className="p-0 shrink-0 pb-6">
          <div className="flex items-center gap-4">
            <DialogTitle>
              {selectedCustomerId ? "Selected Customer" : "Add New Customer"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {selectedCustomerId
                ? "View and manage customer details"
                : "Add a new customer to the system"}
            </DialogDescription>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs flex items-center gap-1 hover:bg-muted"
              onClick={() => {
                setSelectedCustomerId("");
                setCustomerSearchTerm("");
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  address: "",
                  notes: "",
                  vehicles: [],
                });
              }}
              title="Clear all fields"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-1 px-0 min-h-0">
          <form
            id="customer-form"
            onSubmit={handleSubmit}
            className="space-y-6 pb-2"
          >
            <div className="space-y-4">
              {/* Customer Selector Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="customer-select">
                  Select Existing Customer
                </Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={handleCustomerSelect}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an existing customer or create new..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search customers..."
                        value={customerSearchTerm}
                        onChange={(e) =>
                          setCustomerSearchTerm(e.target.value)
                        }
                        className="mb-2"
                      />
                    </div>
                    {isLoadingCustomers ? (
                      <SelectItem value="loading" disabled>
                        Loading customers...
                      </SelectItem>
                    ) : existingCustomers.length > 0 ? (
                      <>
                        <SelectItem value="new-customer">
                          Create New Customer
                        </SelectItem>
                        {existingCustomers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.displayText}
                          </SelectItem>
                        ))}
                      </>
                    ) : (
                      <SelectItem value="no-customers" disabled>
                        {customerSearchTerm
                          ? "No customers found"
                          : "No customers available"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  {selectedCustomerId && (
                    <Badge variant="secondary" className="text-xs">
                      From existing customer
                    </Badge>
                  )}
                </div>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Customer full name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="customer@example.com"
                    type="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Customer address"
                  className="h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
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
                                value={vehicle.licensePlate}
                                onChange={(e) =>
                                  updateVehicle(
                                    vehicle.id,
                                    "licensePlate",
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

        <DialogFooter className="p-0 bg-background shrink-0 flex flex-col sm:flex-row gap-3 sm:gap-2 pt-6">
          <Button
            type="button"
            variant="chonky-secondary"
            onClick={onSkip}
            className="w-full sm:w-auto order-2 sm:order-1 h-auto px-4 py-[9px]"
          >
            Skip
          </Button>
          <Button
            type="submit"
            form="customer-form"
            variant="chonky"
            className="w-full sm:w-auto order-1 sm:order-2 h-auto px-4 py-[9px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner className="text-white mr-2" />
                Adding...
              </>
            ) : (
              "Add Customer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
