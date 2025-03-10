"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, MoreVertical, Phone, Mail, Car, Calendar, Search, Filter, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/page-title"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  vehicles: number
  lastVisit: string
}

const customers: Customer[] = [
  { id: 1, name: "John Smith", email: "john.smith@example.com", phone: "(555) 123-4567", vehicles: 2, lastVisit: "2023-05-15" },
  { id: 2, name: "Sarah Johnson", email: "sarah.j@example.com", phone: "(555) 234-5678", vehicles: 1, lastVisit: "2023-06-02" },
  { id: 3, name: "Michael Brown", email: "mbrown@example.com", phone: "(555) 345-6789", vehicles: 3, lastVisit: "2023-05-28" },
  { id: 4, name: "Emily Davis", email: "emily.davis@example.com", phone: "(555) 456-7890", vehicles: 1, lastVisit: "2023-06-10" },
  { id: 5, name: "Robert Wilson", email: "rwilson@example.com", phone: "(555) 567-8901", vehicles: 2, lastVisit: "2023-05-20" },
  { id: 6, name: "Jennifer Lee", email: "jlee@example.com", phone: "(555) 678-9012", vehicles: 1, lastVisit: "2023-06-05" },
]

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValue, setFilterValue] = useState("All customers")
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([])
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  // Filter customers based on search query and filter value
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      searchQuery === "" || 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    
    const matchesFilter = 
      filterValue === "All customers" || 
      (filterValue === "Multiple" && customer.vehicles > 1) ||
      (filterValue === "Recent" && new Date(customer.lastVisit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
      (filterValue === "New" && new Date(customer.lastVisit) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesFilter;
  });

  // Toggle selection of a customer
  const toggleCustomerSelection = (id: number) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(customerId => customerId !== id) : [...prev, id]
    );
  };

  // Toggle selection of all customers
  const toggleAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  // Automatically switch to card view on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("cards");
      }
    };
    
    // Set initial view mode
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Layout>
      <div className="w-full space-y-6">
        <PageHeader
          actions={
            <Button variant="default" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add customer
            </Button>
          }
        >
          Customers
        </PageHeader>

        {/* Search and Filter Section - Responsive */}
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
                <Select value={filterValue} onValueChange={setFilterValue}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All customers">All customers</SelectItem>
                    <SelectItem value="Recent">Recent customers</SelectItem>
                    <SelectItem value="Multiple">Multiple vehicles</SelectItem>
                    <SelectItem value="New">New customers</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  className="hidden sm:flex"
                >
                  Import
                </Button>
              </div>
              <div className="flex items-center gap-2 sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isFilterExpanded ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile View Tabs */}
          <div className="sm:hidden">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="multiple">Multiple</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block border rounded-md">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left w-10">
                  <input 
                    type="checkbox" 
                    className="rounded" 
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={toggleAllCustomers}
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
              {filteredCustomers.map((customer) => (
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
                  <td className="p-3">{customer.email}</td>
                  <td className="p-3">{customer.phone}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="font-normal">
                      {customer.vehicles} {customer.vehicles === 1 ? 'vehicle' : 'vehicles'}
                    </Badge>
                  </td>
                  <td className="p-3">{new Date(customer.lastVisit).toLocaleDateString('en-GB')}</td>
                  <td className="p-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="overflow-hidden rounded-r-lg">
              <CardContent className="p-0">
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{customer.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Badge variant="outline" className="font-normal">
                          {customer.vehicles} {customer.vehicles === 1 ? 'vehicle' : 'vehicles'}
                        </Badge>
                        <span>•</span>
                        <span>{new Date(customer.lastVisit).toLocaleDateString('en-GB')}</span>
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
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                        {customer.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${customer.phone}`} className="hover:underline">
                        {customer.phone}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Contact
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 border rounded-md rounded-r-lg">
              <p className="text-muted-foreground">No customers found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 