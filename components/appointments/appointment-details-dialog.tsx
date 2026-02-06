"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "@/lib/db/schema";
import { updateAppointmentStatus } from "@/actions/appointments";
import { useToast } from "@/components/ui/use-toast";

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentDetailsDialog({
  appointment,
  open,
  onOpenChange,
}: AppointmentDetailsDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!appointment) return null;

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    const result = await updateAppointmentStatus(appointment.id, newStatus);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Status updated",
        description: `Appointment marked as ${newStatus}`,
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-800",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Appointment Details</DialogTitle>
            <Badge
              variant="secondary"
              className={statusColors[appointment.status] || ""}
            >
              {appointment.status}
            </Badge>
          </div>
          <DialogDescription>
            View and manage appointment information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Customer Name</Label>
              <div className="font-medium text-sm">{appointment.customerName}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Phone Number</Label>
              <div className="font-medium text-sm">{appointment.customerPhone}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Service Type</Label>
              <div className="font-medium text-sm">{appointment.serviceType}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date & Time</Label>
              <div className="font-medium text-sm">
                {new Date(appointment.appointmentDate).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vehicle Details</Label>
            <div className="rounded-md border p-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-xs text-muted-foreground block">Make</span>
                  {appointment.vehicleMake || "-"}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Model</span>
                  {appointment.vehicleModel || "-"}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Year</span>
                  {appointment.vehicleYear || "-"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <div className="rounded-md bg-muted p-3 text-sm">
              {appointment.notes || "No additional notes."}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
            {appointment.status === 'pending' && (
                <>
                    <Button
                        variant="destructive" 
                        onClick={() => handleStatusChange("cancelled")}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleStatusChange("confirmed")}
                        disabled={isLoading}
                         className="bg-blue-600 hover:bg-blue-700"
                    >
                        Confirm Appointment
                    </Button>
                </>
            )}
            
            {appointment.status === 'confirmed' && (
                <>
                     <Button
                        variant="outline" 
                        onClick={() => handleStatusChange("cancelled")}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleStatusChange("completed")}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Mark as Completed
                    </Button>
                </>
            )}

            {(appointment.status === 'cancelled' || appointment.status === 'completed' ) && (
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
