"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  startTransition,
} from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Car,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  Download,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { CustomerForm } from "./customer-form";
import { CustomerDetails } from "./customer-details";
import { DeleteDialog } from "./delete-dialog";
import { ImportDialog } from "./import-dialog";
import { useCustomers } from "./customers-context";
import type { CustomerData } from "@/lib/hooks/data/useCustomers";
import ErrorBoundary from "@/components/ui/error-boundary";

export default function CustomersPage() {
  console.log("🔄 CustomersPage: Component rendering started");

  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    loading,
    error,
  } = useCustomers();
  const { toast } = useToast();

  console.log("📊 CustomersPage: Hook data", {
    customersCount: customers?.length,
    loading,
    error: error?.message,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("All customers");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [completenessFilter, setCompletenessFilter] = useState<
    "all" | "complete" | "incomplete"
  >("all");
  const [requiredFieldsFilter, setRequiredFieldsFilter] = useState<
    "all" | "complete" | "incomplete"
  >("all");

  // Modal states
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  console.log("🎛️ CustomersPage: Current state", {
    searchQuery,
    filterValue,
    isFilterExpanded,
    selectedCustomers,
    viewMode,
    completenessFilter,
    requiredFieldsFilter,
    isCustomerFormOpen,
    isCustomerDetailsOpen,
    isDeleteDialogOpen,
    isImportDialogOpen,
    currentCustomer,
    hasMounted,
  });

  // Helper function to determine if a customer is complete
  const isCustomerComplete = (customer: CustomerData): boolean => {
    const hasRequiredFields =
      customer.name.trim() !== "" && customer.phone.trim() !== "";

    const hasAllRecommendedFields =
      hasRequiredFields &&
      customer.email?.trim() !== "" &&
      customer.address?.trim() !== "" &&
      customer.vehicles.length > 0 &&
      customer.vehicles.every(
        (v) =>
          v.make.trim() !== "" &&
          v.model.trim() !== "" &&
          v.year > 0 &&
          v.plateNumber.trim() !== ""
      );

    return hasAllRecommendedFields;
  };

  // Helper function to determine if required fields are complete
  const hasRequiredFields = (customer: CustomerData): boolean => {
    return customer.name.trim() !== "" && customer.phone.trim() !== "";
  };

  // Filter customers based on search query and filter values
  const filteredCustomers = useMemo(() => {
    console.log("🔍 CustomersPage: Filtering customers", {
      totalCustomers: customers.length,
      searchQuery,
      filterValue,
      completenessFilter,
      requiredFieldsFilter,
    });

    const filtered = customers.filter((customer) => {
      const matchesSearch =
        searchQuery === "" ||
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery);

      const matchesFilter =
        filterValue === "All customers" ||
        (filterValue === "Multiple" && customer.vehicles.length > 1) ||
        (filterValue === "Recent" &&
          new Date(customer.lastVisit || "") >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
        (filterValue === "New" &&
          new Date(customer.lastVisit || "") >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

      const matchesCompleteness =
        completenessFilter === "all" ||
        (completenessFilter === "complete" && isCustomerComplete(customer)) ||
        (completenessFilter === "incomplete" && !isCustomerComplete(customer));

      const matchesRequiredFields =
        requiredFieldsFilter === "all" ||
        (requiredFieldsFilter === "complete" && hasRequiredFields(customer)) ||
        (requiredFieldsFilter === "incomplete" && !hasRequiredFields(customer));

      return (
        matchesSearch &&
        matchesFilter &&
        matchesCompleteness &&
        matchesRequiredFields
      );
    });

    console.log("✅ CustomersPage: Filtered customers", {
      filteredCount: filtered.length,
      originalCount: customers.length,
    });

    return filtered;
  }, [
    customers,
    searchQuery,
    filterValue,
    completenessFilter,
    requiredFieldsFilter,
  ]);

  // Toggle selection of a customer
  const toggleCustomerSelection = useCallback((id: string) => {
    console.log("🎯 CustomersPage: Toggling customer selection", {
      customerId: id,
    });
    setSelectedCustomers((prev) => {
      const newSelection = prev.includes(id)
        ? prev.filter((customerId) => customerId !== id)
        : [...prev, id];
      console.log("📝 CustomersPage: Updated customer selection", {
        previousSelection: prev,
        newSelection,
      });
      return newSelection;
    });
  }, []);

  // Toggle selection of all customers
  const toggleAllCustomers = useCallback(() => {
    console.log("🎯 CustomersPage: Toggling all customers selection");
    if (selectedCustomers.length === filteredCustomers.length) {
      console.log("📝 CustomersPage: Deselecting all customers");
      setSelectedCustomers([]);
    } else {
      const allIds = filteredCustomers.map((c) => c.id);
      console.log("📝 CustomersPage: Selecting all customers", { allIds });
      setSelectedCustomers(allIds);
    }
  }, [selectedCustomers.length, filteredCustomers]);

  // Modal handlers with proper state transitions to prevent race conditions
  const openAddCustomer = useCallback(() => {
    console.log("🚪 Modal: Opening add customer modal");

    startTransition(() => {
      setCurrentCustomer(null);
      setIsCustomerFormOpen(true);
    });

    console.log("✅ Modal: Add customer modal opened");
  }, []);

  const openEditCustomer = useCallback((id: string) => {
    console.log("✏️ Modal: Opening edit customer modal", { customerId: id });

    startTransition(() => {
      setCurrentCustomer(id);
      setIsCustomerFormOpen(true);
    });

    console.log("✅ Modal: Edit customer modal opened", { customerId: id });
  }, []);

  const openViewCustomer = useCallback((id: string) => {
    console.log("👁️ Modal: Opening view customer modal", { customerId: id });

    startTransition(() => {
      setCurrentCustomer(id);
      setIsCustomerDetailsOpen(true);
    });

    console.log("✅ Modal: View customer modal opened", { customerId: id });
  }, []);

  const openDeleteCustomer = useCallback((id: string) => {
    console.log("🗑️ Modal: Opening delete customer modal", { customerId: id });

    startTransition(() => {
      setCurrentCustomer(id);
      setIsDeleteDialogOpen(true);
    });

    console.log("✅ Modal: Delete customer modal opened", { customerId: id });
  }, []);

  const openImportDialog = useCallback(() => {
    console.log("🚪 CustomersPage: Opening import dialog");
    setIsImportDialogOpen(true);
  }, []);

  // Form submission handlers
  const handleAddCustomer = async (
    customerData: Omit<CustomerData, "id" | "createdAt" | "updatedAt">
  ) => {
    console.log("➕ CustomersPage: Adding customer", {
      customerName: customerData.name,
    });
    try {
      await addCustomer(customerData);
      console.log("✅ CustomersPage: Customer added successfully");
      startTransition(() => {
        setIsCustomerFormOpen(false);
      });
      toast({
        title: "Customer added",
        description: `${customerData.name} has been added successfully.`,
      });
    } catch (error) {
      console.error("❌ CustomersPage: Error adding customer", error);
      // Ensure modal stays open on error to allow retry
      startTransition(() => {
        setIsCustomerFormOpen(true);
      });
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCustomer = async (
    customerData: Omit<CustomerData, "id" | "createdAt" | "updatedAt">
  ) => {
    console.log("✏️ CustomersPage: Updating customer", {
      customerId: currentCustomer,
      customerName: customerData.name,
    });
    if (currentCustomer) {
      try {
        await updateCustomer(currentCustomer, customerData);
        console.log("✅ CustomersPage: Customer updated successfully");
        startTransition(() => {
          setIsCustomerFormOpen(false);
        });
        toast({
          title: "Customer updated",
          description: `${customerData.name} has been updated successfully.`,
        });
      } catch (error) {
        console.error("❌ CustomersPage: Error updating customer", error);
        // Ensure modal stays open on error to allow retry
        startTransition(() => {
          setIsCustomerFormOpen(true);
        });
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to update customer. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteCustomer = async () => {
    console.log("🗑️ CustomersPage: Deleting customer", {
      customerId: currentCustomer,
    });
    if (currentCustomer) {
      const customer = customers.find((c) => c.id === currentCustomer);
      try {
        await deleteCustomer(currentCustomer);
        console.log("✅ CustomersPage: Customer deleted successfully");
        startTransition(() => {
          setIsDeleteDialogOpen(false);
        });
        toast({
          title: "Customer deleted",
          description: `${customer?.name} has been deleted.`,
          variant: "destructive",
        });
      } catch (error) {
        console.error("❌ CustomersPage: Error deleting customer", error);
        // Ensure dialog stays open on error to allow retry
        startTransition(() => {
          setIsDeleteDialogOpen(true);
        });
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to delete customer. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleImportCustomers = async (
    importedCustomers: Omit<CustomerData, "id" | "lastVisit">[]
  ) => {
    console.log("📥 CustomersPage: Importing customers", {
      count: importedCustomers.length,
    });

    try {
      const importPromises = importedCustomers.map((customer) =>
        addCustomer(customer)
      );
      await Promise.all(importPromises);

      startTransition(() => {
        setIsImportDialogOpen(false);
      });

      toast({
        title: "Customers imported",
        description: `${importedCustomers.length} customers have been imported successfully.`,
      });
    } catch (error) {
      console.error("❌ CustomersPage: Error importing customers:", error);
      // Keep dialog open on error to allow retry
      startTransition(() => {
        setIsImportDialogOpen(true);
      });
      toast({
        title: "Import Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to import customers. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Wrapper to maintain backward compatibility with legacy references
  const handleFormSubmit = useCallback(
    (customerData: Omit<CustomerData, "id" | "createdAt" | "updatedAt">) => {
      if (currentCustomer) {
        // Delegate to the updated handler when editing
        return handleUpdateCustomer(customerData);
      }
      // Delegate to the updated handler when adding new customer
      return handleAddCustomer(customerData);
    },
    [currentCustomer, handleAddCustomer, handleUpdateCustomer]
  );

  // Handle mobile view
  useEffect(() => {
    console.log("📱 CustomersPage: Setting up resize handler");
    const handleResize = () => {
      const newViewMode = window.innerWidth < 1024 ? "cards" : "table";
      console.log("📱 CustomersPage: Window resized", {
        width: window.innerWidth,
        newViewMode,
      });
      setViewMode(newViewMode);
    };

    // Set initial view mode
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      console.log("🧹 CustomersPage: Cleaning up resize handler");
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    console.log("🏗️ CustomersPage: Component mounted");
    // Set hasMounted to true after component mounts
    setHasMounted(true);
  }, []);

  // Get current customer for modals
  const getCurrentCustomer = useMemo(() => {
    const customer = customers.find((c) => c.id === currentCustomer);
    console.log("👤 CustomersPage: Getting current customer", {
      currentCustomerId: currentCustomer,
      found: !!customer,
    });
    return customer;
  }, [customers, currentCustomer]);

  // Add logging for search query changes
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value;
      console.log("🔍 CustomersPage: Search query changed", {
        oldQuery: searchQuery,
        newQuery,
      });
      setSearchQuery(newQuery);
    },
    [searchQuery]
  );

  // Add logging for filter changes
  const handleFilterChange = useCallback(
    (value: string) => {
      console.log("🔧 CustomersPage: Filter value changed", {
        oldValue: filterValue,
        newValue: value,
      });
      setFilterValue(value);
    },
    [filterValue]
  );

  // Add logging for completeness filter changes
  const handleCompletenessFilterChange = useCallback(
    (value: "all" | "complete" | "incomplete") => {
      console.log("🔧 CustomersPage: Completeness filter changed", {
        oldValue: completenessFilter,
        newValue: value,
      });
      setCompletenessFilter(value);
    },
    [completenessFilter]
  );

  // Add logging for required fields filter changes
  const handleRequiredFieldsFilterChange = useCallback(
    (value: "all" | "complete" | "incomplete") => {
      console.log("🔧 CustomersPage: Required fields filter changed", {
        oldValue: requiredFieldsFilter,
        newValue: value,
      });
      setRequiredFieldsFilter(value);
    },
    [requiredFieldsFilter]
  );

  // Add logging for filter expansion toggle
  const handleFilterExpansionToggle = useCallback(() => {
    console.log("🔧 CustomersPage: Filter expansion toggled", {
      wasExpanded: isFilterExpanded,
      willBeExpanded: !isFilterExpanded,
    });
    setIsFilterExpanded(!isFilterExpanded);
  }, [isFilterExpanded]);

  return (
    <Layout>
      <ErrorBoundary>
        <div className="w-full space-y-6">
          <PageHeader
            actions={
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={openAddCustomer}
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add customer
              </Button>
            }
          >
            <span className="hidden sm:inline">Customers</span>
          </PageHeader>

          {/* Search and Filter Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="w-full sm:w-auto max-w-sm relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search customers"
                  className="w-full pl-10"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                <div className="flex items-center gap-2">
                  {hasMounted ? (
                    <Select
                      value={filterValue}
                      onValueChange={handleFilterChange}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All customers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All customers">
                          All customers
                        </SelectItem>
                        <SelectItem value="Recent">Recent customers</SelectItem>
                        <SelectItem value="Multiple">
                          Multiple vehicles
                        </SelectItem>
                        <SelectItem value="New">New customers</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="w-full sm:w-[180px] h-10 border rounded-md" /> /* Placeholder to maintain layout */
                  )}
                  <Button
                    variant="outline"
                    className="hidden sm:flex"
                    onClick={openImportDialog}
                    disabled={loading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>

                <Button
                  variant={
                    completenessFilter !== "all" ||
                    requiredFieldsFilter !== "all"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className={`w-full sm:w-auto flex ${
                    completenessFilter !== "all" ||
                    requiredFieldsFilter !== "all"
                      ? "bg-primary/90 hover:bg-primary"
                      : ""
                  }`}
                  onClick={handleFilterExpansionToggle}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(completenessFilter !== "all" ||
                    requiredFieldsFilter !== "all") && (
                    <Badge
                      variant="outline"
                      className="ml-2 mr-1 bg-primary-foreground text-primary"
                    >
                      {(completenessFilter !== "all" ? 1 : 0) +
                        (requiredFieldsFilter !== "all" ? 1 : 0)}
                    </Badge>
                  )}
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${
                      isFilterExpanded ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* Expanded Filters Section */}
          {isFilterExpanded && (
            <div className="mb-6 p-4 border rounded-md bg-muted/30 animate-in fade-in duration-200">
              <h3 className="font-medium mb-3">Advanced Filters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Completeness filter */}
                <div className="space-y-2">
                  <Label htmlFor="completeness-filter">
                    Customer Completeness
                  </Label>
                  <Select
                    value={completenessFilter}
                    onValueChange={(value: "all" | "complete" | "incomplete") =>
                      setCompletenessFilter(value)
                    }
                  >
                    <SelectTrigger id="completeness-filter">
                      <SelectValue placeholder="All Records" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Records</SelectItem>
                      <SelectItem value="complete">Complete Records</SelectItem>
                      <SelectItem value="incomplete">
                        Incomplete Records
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Complete records have all fields filled including contact
                    details and vehicles
                  </p>
                </div>

                {/* Required fields filter */}
                <div className="space-y-2">
                  <Label htmlFor="required-fields-filter">
                    Required Fields
                  </Label>
                  <Select
                    value={requiredFieldsFilter}
                    onValueChange={(value: "all" | "complete" | "incomplete") =>
                      setRequiredFieldsFilter(value)
                    }
                  >
                    <SelectTrigger id="required-fields-filter">
                      <SelectValue placeholder="All Records" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Records</SelectItem>
                      <SelectItem value="complete">
                        Has Required Fields
                      </SelectItem>
                      <SelectItem value="incomplete">
                        Missing Required Fields
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Required fields are name and phone number
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden lg:block border rounded-md">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left w-10">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={
                        selectedCustomers.length === filteredCustomers.length &&
                        filteredCustomers.length > 0
                      }
                      onChange={toggleAllCustomers}
                      disabled={loading}
                    />
                  </th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Email</th>
                  <th className="p-3 text-left font-medium">Phone</th>
                  <th className="p-3 text-left font-medium">Vehicles</th>
                  <th className="p-3 text-left font-medium">Last Visit</th>
                  <th className="p-3 text-right w-10"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span>Loading customers...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-red-600">
                      <div className="space-y-2">
                        <p>Error loading customers: {error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.reload()}
                        >
                          Retry
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                        />
                      </td>
                      <td className="p-3 font-medium">{customer.name}</td>
                      <td className="p-3">{customer.email || "-"}</td>
                      <td className="p-3">{customer.phone}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="font-normal">
                          {customer.vehicles.length}{" "}
                          {customer.vehicles.length === 1
                            ? "vehicle"
                            : "vehicles"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {customer.lastVisit
                          ? new Date(customer.lastVisit).toLocaleDateString(
                              "en-GB"
                            )
                          : "-"}
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                console.log(
                                  "🖱️ Dropdown: View details clicked",
                                  {
                                    customerId: customer.id,
                                    customerName: customer.name,
                                    timestamp: new Date().toISOString(),
                                  }
                                );
                                console.log(
                                  "🔄 Dropdown: Current modal states before view",
                                  {
                                    isCustomerFormOpen,
                                    isCustomerDetailsOpen,
                                    isDeleteDialogOpen,
                                    currentCustomer,
                                  }
                                );
                                openViewCustomer(customer.id);
                              }}
                            >
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                console.log("🖱️ Dropdown: Edit clicked", {
                                  customerId: customer.id,
                                  customerName: customer.name,
                                  timestamp: new Date().toISOString(),
                                });
                                console.log(
                                  "🔄 Dropdown: Current modal states before edit",
                                  {
                                    isCustomerFormOpen,
                                    isCustomerDetailsOpen,
                                    isDeleteDialogOpen,
                                    currentCustomer,
                                  }
                                );
                                openEditCustomer(customer.id);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log("🖱️ Dropdown: Delete clicked", {
                                  customerId: customer.id,
                                  customerName: customer.name,
                                  timestamp: new Date().toISOString(),
                                });
                                console.log(
                                  "🔄 Dropdown: Current modal states before delete",
                                  {
                                    isCustomerFormOpen,
                                    isCustomerDetailsOpen,
                                    isDeleteDialogOpen,
                                    currentCustomer,
                                  }
                                );
                                openDeleteCustomer(customer.id);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span>Loading customers...</span>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="p-8 text-center text-red-600">
                  <div className="space-y-2">
                    <p>Error loading customers: {error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : filteredCustomers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No customers found
                </CardContent>
              </Card>
            ) : (
              filteredCustomers.map((customer) => (
                <Card key={customer.id} className="overflow-hidden rounded-lg">
                  <CardContent className="p-0">
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-base">
                            {customer.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Badge variant="outline" className="font-normal">
                              {customer.vehicles.length}{" "}
                              {customer.vehicles.length === 1
                                ? "vehicle"
                                : "vehicles"}
                            </Badge>
                            <span>•</span>
                            <span>
                              {customer.lastVisit
                                ? new Date(
                                    customer.lastVisit
                                  ).toLocaleDateString("en-GB")
                                : "No visits"}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                console.log(
                                  "🖱️ Dropdown: View details clicked",
                                  {
                                    customerId: customer.id,
                                    customerName: customer.name,
                                    timestamp: new Date().toISOString(),
                                  }
                                );
                                console.log(
                                  "🔄 Dropdown: Current modal states before view",
                                  {
                                    isCustomerFormOpen,
                                    isCustomerDetailsOpen,
                                    isDeleteDialogOpen,
                                    currentCustomer,
                                  }
                                );
                                openViewCustomer(customer.id);
                              }}
                            >
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                console.log("🖱️ Dropdown: Edit clicked", {
                                  customerId: customer.id,
                                  customerName: customer.name,
                                  timestamp: new Date().toISOString(),
                                });
                                console.log(
                                  "🔄 Dropdown: Current modal states before edit",
                                  {
                                    isCustomerFormOpen,
                                    isCustomerDetailsOpen,
                                    isDeleteDialogOpen,
                                    currentCustomer,
                                  }
                                );
                                openEditCustomer(customer.id);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log("🖱️ Dropdown: Delete clicked", {
                                  customerId: customer.id,
                                  customerName: customer.name,
                                  timestamp: new Date().toISOString(),
                                });
                                console.log(
                                  "🔄 Dropdown: Current modal states before delete",
                                  {
                                    isCustomerFormOpen,
                                    isCustomerDetailsOpen,
                                    isDeleteDialogOpen,
                                    currentCustomer,
                                  }
                                );
                                openDeleteCustomer(customer.id);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`mailto:${customer.email}`}
                              className="text-primary hover:underline"
                            >
                              {customer.email}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`tel:${customer.phone}`}
                            className="hover:underline"
                          >
                            {customer.phone}
                          </a>
                        </div>
                      </div>

                      <div className="flex justify-between pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            console.log("🖱️ Button: View Details clicked", {
                              customerId: customer.id,
                              customerName: customer.name,
                              timestamp: new Date().toISOString(),
                            });
                            console.log(
                              "🔄 Button: Current modal states before view",
                              {
                                isCustomerFormOpen,
                                isCustomerDetailsOpen,
                                isDeleteDialogOpen,
                                currentCustomer,
                              }
                            );
                            openViewCustomer(customer.id);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            console.log("🖱️ Button: Edit Customer clicked", {
                              customerId: customer.id,
                              customerName: customer.name,
                              timestamp: new Date().toISOString(),
                            });
                            console.log(
                              "🔄 Button: Current modal states before edit",
                              {
                                isCustomerFormOpen,
                                isCustomerDetailsOpen,
                                isDeleteDialogOpen,
                                currentCustomer,
                              }
                            );
                            openEditCustomer(customer.id);
                          }}
                        >
                          Edit Customer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Customer Form Modal */}
        <CustomerForm
          isOpen={isCustomerFormOpen}
          onClose={() => {
            console.log("🚪 Modal: Closing customer form modal");
            startTransition(() => {
              setIsCustomerFormOpen(false);
            });
          }}
          onSubmit={handleFormSubmit}
          loading={loading}
          customer={getCurrentCustomer}
        />

        {/* Customer Details Modal */}
        {getCurrentCustomer && (
          <CustomerDetails
            isOpen={isCustomerDetailsOpen}
            onClose={() => {
              console.log("🚪 Modal: Closing customer details modal");
              startTransition(() => {
                setIsCustomerDetailsOpen(false);
              });
            }}
            customer={getCurrentCustomer}
            onEdit={() => {
              console.log("✏️ Modal: Transitioning from details to edit modal");
              startTransition(() => {
                setIsCustomerDetailsOpen(false);
                setIsCustomerFormOpen(true);
              });
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {getCurrentCustomer && (
          <DeleteDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => {
              console.log("🚪 Modal: Closing delete confirmation dialog");
              startTransition(() => {
                setIsDeleteDialogOpen(false);
              });
            }}
            onConfirm={handleDeleteCustomer}
            customerName={getCurrentCustomer?.name ?? ""}
          />
        )}

        {/* Import Dialog */}
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImport={handleImportCustomers}
        />
      </ErrorBoundary>
    </Layout>
  );
}
