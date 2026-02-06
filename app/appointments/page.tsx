import { Suspense } from "react";
import { getAppointments } from "@/actions/appointments";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Layout } from "@/components/layout";

import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";

export const metadata = {
  title: "Appointments | HNS Automotive",
  description: "Manage service appointments.",
};

export default async function AppointmentsPage() {
  const result = await getAppointments();
  const appointments = result.success ? result.data || [] : [];

  // Calculate stats
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const today = new Date();
  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.appointmentDate);
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  }).length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="flex-1 space-y-4 p-[2px] md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2 md:hidden">
            <h2 className="text-3xl font-bold tracking-tight font-wide border-b-2 border-[#d5f365] pb-1">Appointments</h2>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">Requires confirmation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Schedule</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayAppointments}</div>
                <p className="text-xs text-muted-foreground">Appointments today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Confirmed</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{confirmedCount}</div>
                <p className="text-xs text-muted-foreground">Ready for service</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Tabs defaultValue="pending" className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="h-auto flex-wrap justify-start">
                  <TabsTrigger value="pending" className="relative">
                    Pending
                    {pendingCount > 0 && (
                      <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] text-white">
                        {pendingCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <NewAppointmentDialog />
                </div>
              </div>

              <TabsContent value="pending" className="space-y-4">
                <AppointmentTable 
                  appointments={appointments.filter(a => a.status === 'pending')} 
                />
              </TabsContent>
              <TabsContent value="upcoming" className="space-y-4">
                 <AppointmentTable 
                  appointments={appointments.filter(a => a.status === 'confirmed')} 
                />
              </TabsContent>
              <TabsContent value="completed" className="space-y-4">
                 <AppointmentTable 
                  appointments={appointments.filter(a => a.status === 'completed' || a.status === 'cancelled')} 
                />
              </TabsContent>
               <TabsContent value="all" className="space-y-4">
                 <AppointmentTable appointments={appointments} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
