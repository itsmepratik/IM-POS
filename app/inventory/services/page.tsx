"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Wrench,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Service } from "@/lib/db/schema";

export default function InventoryServicesPage() {
  return <ServicesManager />;
}

function ServicesManager() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    category: "labor",
    defaultPrice: "",
    estimatedDurationMinutes: "",
  });

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getAllServices } = await import("@/lib/actions/services");
      const data = await getAllServices();
      setServices(data);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nameAr && s.nameAr.includes(searchQuery)),
  );

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        nameAr: service.nameAr || "",
        description: service.description || "",
        category: service.category || "labor",
        defaultPrice: service.defaultPrice?.toString() || "",
        estimatedDurationMinutes:
          service.estimatedDurationMinutes?.toString() || "",
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        nameAr: "",
        description: "",
        category: "labor",
        defaultPrice: "",
        estimatedDurationMinutes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Service name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { createService, updateService } = await import(
        "@/lib/actions/services"
      );

      const payload = {
        name: formData.name.trim(),
        nameAr: formData.nameAr.trim() || null,
        description: formData.description.trim() || null,
        category: formData.category,
        defaultPrice: formData.defaultPrice ? formData.defaultPrice : null,
        estimatedDurationMinutes: formData.estimatedDurationMinutes
          ? Number(formData.estimatedDurationMinutes)
          : null,
      };

      if (editingService) {
        await updateService(editingService.id, payload);
        toast({
          title: "Service Updated",
          description: `${formData.name} has been updated`,
        });
      } else {
        await createService(payload);
        toast({
          title: "Service Created",
          description: `${formData.name} has been added to the catalog`,
        });
      }

      setIsDialogOpen(false);
      fetchServices();
    } catch (error) {
      console.error("Failed to save service:", error);
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const { updateService } = await import("@/lib/actions/services");
      await updateService(service.id, { isActive: !service.isActive });
      toast({
        title: service.isActive ? "Service Deactivated" : "Service Activated",
        description: `${service.name} is now ${service.isActive ? "inactive" : "active"}`,
      });
      fetchServices();
    } catch (error) {
      console.error("Failed to toggle service:", error);
      toast({
        title: "Error",
        description: "Failed to update service status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Deactivate "${service.name}"?`)) return;

    try {
      const { deleteService } = await import("@/lib/actions/services");
      await deleteService(service.id);
      toast({
        title: "Service Deactivated",
        description: `${service.name} has been deactivated`,
      });
      fetchServices();
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate service",
        variant: "destructive",
      });
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "labor":
        return (
          <Badge variant="default" className="bg-blue-600">
            Labor
          </Badge>
        );
      case "diagnostic":
        return (
          <Badge variant="default" className="bg-purple-600">
            Diagnostic
          </Badge>
        );
      case "composite":
        return (
          <Badge variant="default" className="bg-orange-600">
            Composite
          </Badge>
        );
      default:
        return <Badge variant="secondary">{category}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Services
          </h1>
          <p className="text-muted-foreground">
            Manage labor services, diagnostics, and custom service pricing
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Catalog</CardTitle>
          <CardDescription>
            {services.filter((s) => s.isActive).length} active /{" "}
            {services.length} total services
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading services...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "No services match your search"
                : "No services defined yet. Click 'Add Service' to create one."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Arabic Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Default Price</TableHead>
                    <TableHead>Est. Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow
                      key={service.id}
                      className={!service.isActive ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <button
                          onClick={() => handleToggleActive(service)}
                          className="hover:opacity-80 transition-opacity"
                          title={
                            service.isActive
                              ? "Click to deactivate"
                              : "Click to activate"
                          }
                        >
                          {service.isActive ? (
                            <ToggleRight className="h-6 w-6 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {service.nameAr || "-"}
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(service.category)}
                      </TableCell>
                      <TableCell>
                        {service.defaultPrice
                          ? `${Number(service.defaultPrice).toFixed(3)} OMR`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {service.estimatedDurationMinutes
                          ? `${service.estimatedDurationMinutes} min`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(service)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(service)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="svc-name">Service Name *</Label>
              <Input
                id="svc-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Brake Disc Repair"
              />
            </div>

            <div>
              <Label htmlFor="svc-name-ar">Arabic Name</Label>
              <Input
                id="svc-name-ar"
                value={formData.nameAr}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
                placeholder="e.g. إصلاح قرص الفرامل"
              />
            </div>

            <div>
              <Label htmlFor="svc-desc">Description</Label>
              <Textarea
                id="svc-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this service"
                rows={2}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) =>
                  setFormData({ ...formData, category: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  <SelectItem value="composite">Composite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="svc-price">Default Price (OMR)</Label>
                <Input
                  id="svc-price"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.defaultPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultPrice: e.target.value })
                  }
                  placeholder="0.000"
                />
              </div>
              <div>
                <Label htmlFor="svc-duration">Est. Duration (min)</Label>
                <Input
                  id="svc-duration"
                  type="number"
                  min="0"
                  value={formData.estimatedDurationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedDurationMinutes: e.target.value,
                    })
                  }
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingService ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
