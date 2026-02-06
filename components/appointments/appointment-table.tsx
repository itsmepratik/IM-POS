"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Calendar, Car, User } from "lucide-react";
import { Appointment } from "@/lib/db/schema";
import { AppointmentDetailsDialog } from "./appointment-details-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

interface AppointmentTableProps {
  appointments: Appointment[];
}

export function AppointmentTable({ appointments }: AppointmentTableProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    confirmed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    completed: "bg-green-100 text-green-800 hover:bg-green-100",
    cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
    no_show: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  };

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20 h-64">
        <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No appointments found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          There are no appointments matching your current filter.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id} className="cursor-pointer" onClick={() => handleViewDetails(appointment)}>
                <TableCell className="font-medium">
                  {format(new Date(appointment.appointmentDate), "PP")}
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(appointment.appointmentDate), "p")}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{appointment.customerName}</span>
                    <span className="text-xs text-muted-foreground">{appointment.customerPhone}</span>
                  </div>
                </TableCell>
                <TableCell>{appointment.serviceType}</TableCell>
                <TableCell>
                  {appointment.vehicleMake ? (
                    <div className="flex flex-col">
                      <span>{appointment.vehicleMake} {appointment.vehicleModel}</span>
                      <span className="text-xs text-muted-foreground">{appointment.vehicleYear}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">Not specified</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[appointment.status] || ""}>
                    {appointment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewDetails(appointment)}>
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {appointments.map((appointment) => (
          <Card key={appointment.id} onClick={() => handleViewDetails(appointment)} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  {appointment.customerName}
                </CardTitle>
                <CardDescription>
                  {format(new Date(appointment.appointmentDate), "PPP p")}
                </CardDescription>
              </div>
              <Badge variant="secondary" className={statusColors[appointment.status] || ""}>
                {appointment.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <User className="mr-2 h-4 w-4" />
                  {appointment.customerPhone}
                </div>
                <div className="flex items-center text-muted-foreground">
                   <span className="font-medium text-foreground mr-2">Service:</span> {appointment.serviceType}
                </div>
                {appointment.vehicleMake && (
                  <div className="flex items-center text-muted-foreground">
                    <Car className="mr-2 h-4 w-4" />
                    {appointment.vehicleMake} {appointment.vehicleModel} ({appointment.vehicleYear})
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
