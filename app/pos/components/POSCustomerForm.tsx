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
import { Plus, Eraser, Car, Trash2, Search, UserPlus } from "lucide-react";
import { CustomerData, Vehicle } from "@/lib/services/customerService";
import { customerService } from "@/lib/services/customerService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [activeTab, setActiveTab] = useState<"search" | "create">("search");
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
        `/api/customers/dropdown?search=${encodeURIComponent(search)}&limit=50`,
      );
      if (response.ok) {
        const data = await response.json();
        const sortedCustomers = (data.customers || []).sort(
          (a: { displayText?: string }, b: { displayText?: string }) =>
            (a.displayText || "").localeCompare(b.displayText || ""),
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
    [setCurrentCustomer],
  );

  // Load customers when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("search");
      setCustomerSearchTerm("");
      setSelectedCustomerId("");
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        vehicles: [],
      });
      fetchCustomers("");
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

    try {
      if (selectedCustomerId && activeTab === "search") {
        // Form submission from search tab (fallback if needed)
        const fullCustomerData: CustomerData = {
          id: selectedCustomerId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes,
          vehicles: formData.vehicles,
          lastVisit: new Date().toISOString(),
        };
        onSubmit(fullCustomerData);
      } else {
        // Create new customer
        const customerData = await customerService.createCustomer({
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

        if (customerData && customerData.id) {
          setCurrentCustomer(customerData);
          onSubmit(customerData);
        } else {
          throw new Error("Failed to handle customer - missing customer ID");
        }
      }
    } catch (error) {
      console.error("Error submitting customer:", error);
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
          id: crypto.randomUUID(),
          make: "",
          model: "",
          year: "",
          licensePlate: "",
          notes: "",
        },
      ],
    }));
  };

  const updateVehicle = (id: string, field: keyof Vehicle, value: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) =>
        v.id === id ? { ...v, [field]: value } : v,
      ),
    }));
  };

  const removeVehicle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((vehicle) => vehicle.id !== id),
    }));
  };

  // Helper to instantly select an existing customer
  const handleInstantSelect = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (response.ok) {
        const responseData = await response.json();
        const customer = responseData.customer;

        if (customer && customer.id) {
          const fullCustomerData: CustomerData = {
            id: customer.id,
            name: customer.name || "",
            email: customer.email || "",
            phone: customer.phone || "",
            address: customer.address || "",
            notes: customer.notes || "",
            vehicles: customer.vehicles || [],
            lastVisit: new Date().toISOString(),
          };
          setCurrentCustomer(fullCustomerData);
          onSubmit(fullCustomerData); // Instantly submit and close
        }
      }
    } catch (error) {
      console.error("Failed to load customer details", error);
    }
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
                setActiveTab("create"); // Switch to create tab after clearing
              }}
              title="Clear all fields"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-1 px-0 min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "search" | "create")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="search">
                <Search className="w-4 h-4 mr-2" />
                Find Existing
              </TabsTrigger>
              <TabsTrigger value="create">
                <UserPlus className="w-4 h-4 mr-2" />
                Create New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4 outline-none">
              <div className="space-y-2">
                <Input
                  autoFocus
                  placeholder="Search customers by name, phone, or email..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="w-full text-lg h-12"
                />
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-2 space-y-1">
                  {isLoadingCustomers ? (
                    <div className="p-4 flex justify-center text-muted-foreground">
                      Searching...
                    </div>
                  ) : existingCustomers.length > 0 ? (
                    existingCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleInstantSelect(customer.id)}
                        className="w-full text-left p-3 hover:bg-muted rounded-md transition-colors border border-transparent hover:border-gray-200"
                      >
                        <div className="font-medium text-lg">
                          {customer.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {customer.phone ||
                            customer.email ||
                            "No contact info"}
                        </div>
                      </button>
                    ))
                  ) : customerSearchTerm.length > 0 ? (
                    <div className="p-8 text-center space-y-4">
                      <p className="text-muted-foreground">
                        No customers found matching "{customerSearchTerm}"
                      </p>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            name: customerSearchTerm,
                          }));
                          setActiveTab("create");
                        }}
                      >
                        Create new customer
                      </Button>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      Type to search existing customers
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex justify-between gap-3 pt-4 border-t mt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={onSkip}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="create" className="outline-none">
              <form
                id="customer-create-form"
                onSubmit={handleSubmit}
                className="space-y-6 pb-2"
              >
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
                          key={vehicle.id!}
                          value={vehicle.id!}
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
                                removeVehicle(vehicle.id!);
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
                                  value={vehicle.make || ""}
                                  onChange={(e) =>
                                    updateVehicle(
                                      vehicle.id!,
                                      "make",
                                      e.target.value || "",
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
                                  value={vehicle.model || ""}
                                  onChange={(e) =>
                                    updateVehicle(
                                      vehicle.id!,
                                      "model",
                                      e.target.value || "",
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
                                  value={vehicle.year || ""}
                                  onChange={(e) =>
                                    updateVehicle(
                                      vehicle.id!,
                                      "year",
                                      e.target.value || "",
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
                                  value={vehicle.licensePlate || ""}
                                  onChange={(e) =>
                                    updateVehicle(
                                      vehicle.id!,
                                      "licensePlate",
                                      e.target.value || "",
                                    )
                                  }
                                  placeholder="ABC-1234"
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
                                      vehicle.id!,
                                      "notes",
                                      e.target.value || "",
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
                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                  <Button variant="outline" type="button" onClick={onSkip}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="customer-create-form"
                    className="flex-1 max-w-[200px]"
                    disabled={isSubmitting || !formData.name || !formData.phone}
                  >
                    {isSubmitting ? "Saving..." : "Create Customer"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
