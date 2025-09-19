"use client";

import { useState, useEffect } from "react";
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

export default function CustomersPage() {
  const { 
    customers, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    loading, 
    error 
  } = useCustomers();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("All customers");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
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
  const [currentCustomer, setCurrentCustomer] = useState<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

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
  const filteredCustomers = customers.filter((customer) => {
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

  // Toggle selection of a customer
  const toggleCustomerSelection = (id: number) => {
    setSelectedCustomers((prev) =>
      prev.includes(id)
        ? prev.filter((customerId) => customerId !== id)
        : [...prev, id]
    );
  };

  // Toggle selection of all customers
  const toggleAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map((c) => c.id));
    }
  };

  // Modal handlers
  const openAddCustomer = () => {
    setCurrentCustomer(null);
    setIsCustomerFormOpen(true);
  };

  const openEditCustomer = (id: number) => {
    setCurrentCustomer(id);
    setIsCustomerFormOpen(true);
  };

  const openViewCustomer = (id: number) => {
    setCurrentCustomer(id);
    setIsCustomerDetailsOpen(true);
  };

  const openDeleteCustomer = (id: number) => {
    setCurrentCustomer(id);
    setIsDeleteDialogOpen(true);
  };

  const openImportDialog = () => {
    setIsImportDialogOpen(true);
  };

  // Form submission handlers
  const handleAddCustomer = async (
    customerData: Omit<CustomerData, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await addCustomer(customerData);
      setIsCustomerFormOpen(false);
      toast({
        title: "Customer added",
        description: `${customerData.name} has been added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCustomer = async (
    customerData: Omit<CustomerData, "id" | "createdAt" | "updatedAt">
  ) => {
    if (currentCustomer) {
      try {
        await updateCustomer(currentCustomer, customerData);
        setIsCustomerFormOpen(false);
        toast({
          title: "Customer updated",
          description: `${customerData.name} has been updated successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update customer. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteCustomer = async () => {
    if (currentCustomer) {
      const customer = customers.find((c) => c.id === currentCustomer);
      try {
        await deleteCustomer(currentCustomer);
        setIsDeleteDialogOpen(false);
        toast({
          title: "Customer deleted",
          description: `${customer?.name} has been deleted.`,
          variant: "destructive",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete customer. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleImportCustomers = (
    importedCustomers: Omit<CustomerData, "id" | "lastVisit">[]
  ) => {
    importedCustomers.forEach((customer) => {
      addCustomer(customer);
    });
    toast({
      title: "Customers imported",
      description: `${importedCustomers.length} customers have been imported successfully.`,
    });
  };

  // Handle mobile view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode("cards");
      } else {
        setViewMode("table");
      }
    };

    // Set initial view mode
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Set hasMounted to true after component mounts
    setHasMounted(true);
  }, []);

  // Get current customer for modals
  const getCurrentCustomer = () => {
    return customers.find((c) => c.id === currentCustomer);
  };

  return (
    <Layout>
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
              <div className="flex items-center gap-2">
                {hasMounted ? (
                  <Select value={filterValue} onValueChange={setFilterValue}>
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
                  completenessFilter !== "all" || requiredFieldsFilter !== "all"
                    ? "default"
                    : "outline"
                }
                size="sm"
                className={`w-full sm:w-auto flex ${
                  completenessFilter !== "all" || requiredFieldsFilter !== "all"
                    ? "bg-primary/90 hover:bg-primary"
                    : ""
                }`}
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
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
                <Label htmlFor="required-fields-filter">Required Fields</Label>
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
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-muted/50">
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
                      {customer.vehicles.length === 1 ? "vehicle" : "vehicles"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {customer.lastVisit
                      ? new Date(customer.lastVisit).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                  <td className="p-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openViewCustomer(customer.id)}
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditCustomer(customer.id)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => openDeleteCustomer(customer.id)}
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
                            ? new Date(customer.lastVisit).toLocaleDateString(
                                "en-GB"
                              )
                            : "No visits"}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openViewCustomer(customer.id)}
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditCustomer(customer.id)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => openDeleteCustomer(customer.id)}
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
                      onClick={() => openViewCustomer(customer.id)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => openEditCustomer(customer.id)}
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
      {isCustomerFormOpen && (
        <CustomerForm
          isOpen={isCustomerFormOpen}
          onClose={() => setIsCustomerFormOpen(false)}
          customer={getCurrentCustomer()}
          onSubmit={currentCustomer ? handleUpdateCustomer : handleAddCustomer}
          loading={loading}
        />
      )}

      {/* Customer Details Modal */}
      {isCustomerDetailsOpen && getCurrentCustomer() && (
        <CustomerDetails
          isOpen={isCustomerDetailsOpen}
          onClose={() => setIsCustomerDetailsOpen(false)}
          customer={getCurrentCustomer()!}
          onEdit={() => {
            setIsCustomerDetailsOpen(false);
            setIsCustomerFormOpen(true);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && getCurrentCustomer() && (
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteCustomer}
          customerName={getCurrentCustomer()!.name}
        />
      )}

      {/* Import Dialog */}
      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImport={handleImportCustomers}
        />
      )}
    </Layout>
  );
}
