"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
  ClipboardList,
  FileText,
} from "lucide-react";
import { CustomerData, Vehicle } from "./customer-form";

interface CustomerDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerData;
  onEdit: () => void;
}

export function CustomerDetails({
  isOpen,
  onClose,
  customer,
  onEdit,
}: CustomerDetailsProps) {
  // Helper function to convert address object to string
  const formatAddress = (address: any): string => {
    if (!address) return "";
    if (typeof address === "string") return address;
    if (typeof address === "object") {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-[600px] max-h-[90vh] rounded-lg overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="text-xl">{customer.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ScrollArea
            className="h-full overflow-auto pr-2"
            style={{ maxHeight: "calc(85vh - 10rem)" }}
          >
            <div className="px-6 pb-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Info Section */}
                <div className="space-y-3 col-span-full">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Contact Information
                  </h3>
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

                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${customer.phone}`}
                          className="hover:underline"
                        >
                          {customer.phone}
                        </a>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{formatAddress(customer.address)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Details Section */}
                <div className="space-y-3 col-span-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Customer Details
                    </h3>
                    {customer.lastVisit && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        Last Visit:{" "}
                        {new Date(customer.lastVisit).toLocaleDateString(
                          "en-GB"
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Car className="h-3.5 w-3.5" />
                      {customer.vehicles.length}{" "}
                      {customer.vehicles.length === 1 ? "vehicle" : "vehicles"}
                    </Badge>

                    {/* Add more badges here as needed */}
                  </div>

                  {customer.notes && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">Notes</h4>
                      </div>
                      <p className="text-sm whitespace-pre-wrap pl-6">
                        {customer.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicles Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicles ({customer.vehicles.length})
                </h3>

                {customer.vehicles.length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                    {customer.vehicles.map((vehicle) => (
                      <AccordionItem
                        key={vehicle.id}
                        value={vehicle.id}
                        className="border rounded-md px-4 my-2"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center text-left">
                            <span className="font-medium">
                              {vehicle.make} {vehicle.model} {vehicle.year}
                            </span>
                            {vehicle.plateNumber && (
                              <Badge variant="outline" className="ml-2">
                                {vehicle.plateNumber}
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-3 pt-1">
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <h4 className="text-xs text-muted-foreground">
                                  Make
                                </h4>
                                <p>{vehicle.make || "-"}</p>
                              </div>
                              <div>
                                <h4 className="text-xs text-muted-foreground">
                                  Model
                                </h4>
                                <p>{vehicle.model || "-"}</p>
                              </div>
                              <div>
                                <h4 className="text-xs text-muted-foreground">
                                  Year
                                </h4>
                                <p>{vehicle.year || "-"}</p>
                              </div>
                              <div>
                                <h4 className="text-xs text-muted-foreground">
                                  License Plate
                                </h4>
                                <p>{vehicle.plateNumber || "-"}</p>
                              </div>
                            </div>

                            {vehicle.vin && (
                              <div>
                                <h4 className="text-xs text-muted-foreground">
                                  VIN
                                </h4>
                                <p className="font-mono text-sm">
                                  {vehicle.vin}
                                </p>
                              </div>
                            )}

                            {vehicle.notes && (
                              <div>
                                <h4 className="text-xs text-muted-foreground">
                                  Notes
                                </h4>
                                <p className="text-sm whitespace-pre-wrap">
                                  {vehicle.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-6 border border-dashed rounded-md">
                    <Car className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No vehicles added
                    </p>
                  </div>
                )}
              </div>

              {/* Service History would go here */}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>Edit Customer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
