"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerSelectorProps {
  value?: Customer | null;
  onValueChange: (customer: Customer | null) => void;
  onAddNew?: () => void;
  placeholder?: string;
  className?: string;
}

export function CustomerSelector({
  value,
  onValueChange,
  onAddNew,
  placeholder = "Search existing customer or add new...",
  className,
}: CustomerSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Fetch customers from API
  React.useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/customers");
        if (response.ok) {
          const data = await response.json();
          // Handle the API response structure: { customers: [...], pagination: {...} }
          const customerList = data.customers || data || [];
          setCustomers(Array.isArray(customerList) ? customerList : []);
        } else {
          console.error("Failed to fetch customers:", response.status, response.statusText);
          setCustomers([]);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchCustomers();
    }
  }, [open]);

  // Handle customer selection with improved mobile support
  const handleSelect = React.useCallback((selectedValue: string) => {
    if (selectedValue === "clear") {
      onValueChange(null);
      setOpen(false);
      return;
    }

    // Parse the value to extract customer ID
    const [customerId] = selectedValue.split(":");
    const customerList = Array.isArray(customers) ? customers : [];
    const customer = customerList.find((c) => c.id === customerId);
    
    if (customer) {
      onValueChange(customer);
    }
    setOpen(false);
  }, [customers, onValueChange]);

  // Handle add new customer
  const handleAddNew = React.useCallback(() => {
    setOpen(false);
    onAddNew?.();
  }, [onAddNew]);

  // Filter customers based on search
  const filteredCustomers = React.useMemo(() => {
    // Ensure customers is always an array
    const customerList = Array.isArray(customers) ? customers : [];
    
    if (!searchValue.trim()) return customerList;
    
    const search = searchValue.toLowerCase();
    return customerList.filter(
      (customer) =>
        customer.name.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.includes(search)
    );
  }, [customers, searchValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {value ? value.name : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[400px] p-0" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Command 
          className="w-full"
          shouldFilter={false}
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search customers..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-foreground">Loading customers...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-foreground">No customers found.</p>
                  {onAddNew && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddNew}
                      className="mx-auto flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add new customer
                    </Button>
                  )}
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {/* Clear selection option */}
              <CommandItem
                value="clear"
                onSelect={handleSelect}
                className="cursor-pointer touch-manipulation hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="h-4 w-4" />
                  <span className="text-foreground font-medium">Clear selection</span>
                </div>
              </CommandItem>
              
              {/* Customer list */}
              {filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.id}:${customer.name.toLowerCase()}`}
                  onSelect={handleSelect}
                  className="cursor-pointer touch-manipulation hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value?.id === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className="font-medium text-foreground truncate">
                        {customer.name}
                      </span>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {customer.email && (
                          <span className="truncate">{customer.email}</span>
                        )}
                        {customer.phone && (
                          <span className="truncate">{customer.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}