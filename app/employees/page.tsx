"use client";

import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import {
  useEmployees,
  Employee,
} from "@/lib/hooks/data/useEmployees";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  UserCheck,
  UserX,
  DollarSign,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Loader2,
  Save,
  Shield,
  ArrowUpDown,
  Filter,
  X,
  Eye,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ROLES = [
  { value: "admin", label: "Admin", color: "bg-red-100 text-red-800" },
  { value: "manager", label: "Manager", color: "bg-blue-100 text-blue-800" },
  { value: "technician", label: "Technician", color: "bg-green-100 text-green-800" },
  { value: "cashier", label: "Cashier", color: "bg-purple-100 text-purple-800" },
  { value: "staff", label: "Staff", color: "bg-gray-100 text-gray-800" },
];

function getRoleBadge(role: string) {
  const r = ROLES.find((r) => r.value === role) ?? ROLES[4];
  return (
    <Badge variant="secondary" className={`${r.color} border-none font-medium`}>
      {r.label}
    </Badge>
  );
}

function formatCurrency(amount: string | null) {
  if (!amount) return "—";
  return `OMR ${parseFloat(amount).toFixed(3)}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type SortField = "name" | "staff_id" | "role" | "salary" | "hire_date" | "is_active";
type SortDir = "asc" | "desc";

interface EmployeeFormData {
  staff_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  salary: string;
  hire_date: string;
  date_of_birth: string;
  address: string;
  national_id: string;
  emergency_contact: string;
  emergency_phone: string;
  shop_id: string;
  notes: string;
}

const EMPTY_FORM: EmployeeFormData = {
  staff_id: "",
  name: "",
  email: "",
  phone: "",
  role: "staff",
  salary: "",
  hire_date: "",
  date_of_birth: "",
  address: "",
  national_id: "",
  emergency_contact: "",
  emergency_phone: "",
  shop_id: "",
  notes: "",
};

function EmployeeForm({
  employee,
  onSubmit,
  onCancel,
  isLoading,
}: {
  employee?: Employee;
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<EmployeeFormData>(() => {
    if (employee) {
      return {
        staff_id: employee.staff_id,
        name: employee.name,
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        role: employee.role,
        salary: employee.salary ?? "",
        hire_date: employee.hire_date
          ? new Date(employee.hire_date).toISOString().split("T")[0]
          : "",
        date_of_birth: employee.date_of_birth
          ? new Date(employee.date_of_birth).toISOString().split("T")[0]
          : "",
        address: employee.address ?? "",
        national_id: employee.national_id ?? "",
        emergency_contact: employee.emergency_contact ?? "",
        emergency_phone: employee.emergency_phone ?? "",
        shop_id: employee.shop_id ?? "",
        notes: employee.notes ?? "",
      };
    }
    return EMPTY_FORM;
  });

  const [activeTab, setActiveTab] = useState("personal");

  const handleChange = (field: keyof EmployeeFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col max-h-[75vh]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
          <TabsContent value="personal" className="space-y-4 mt-0">
            {!employee && (
              <div className="space-y-2">
                <Label htmlFor="staff_id">Staff ID *</Label>
                <Input
                  id="staff_id"
                  value={form.staff_id}
                  onChange={(e) => handleChange("staff_id", e.target.value)}
                  placeholder="e.g., 0010"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+968 9123 4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Full residential address"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="national_id">National / Civil ID</Label>
              <Input
                id="national_id"
                value={form.national_id}
                onChange={(e) => handleChange("national_id", e.target.value)}
                placeholder="ID number"
              />
            </div>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Salary (OMR)</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.salary}
                  onChange={(e) => handleChange("salary", e.target.value)}
                  placeholder="0.000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={form.hire_date}
                  onChange={(e) => handleChange("hire_date", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional notes about this employee"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
              <Input
                id="emergency_contact"
                value={form.emergency_contact}
                onChange={(e) =>
                  handleChange("emergency_contact", e.target.value)
                }
                placeholder="Contact person name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
              <Input
                id="emergency_phone"
                value={form.emergency_phone}
                onChange={(e) =>
                  handleChange("emergency_phone", e.target.value)
                }
                placeholder="+968 9123 4567"
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <DialogFooter className="pt-4 border-t mt-auto">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isLoading ? "Saving..." : employee ? "Update Employee" : "Add Employee"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EmployeeDetailDialog({
  employee,
  open,
  onClose,
}: {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[600px] max-w-[95vw] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div>{employee.name}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {employee.staff_id} &middot; {getRoleBadge(employee.role)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {employee.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{employee.email}</span>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{employee.phone}</span>
            </div>
          )}
          {employee.hire_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Hired {formatDate(employee.hire_date)}</span>
            </div>
          )}
          {employee.salary && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{formatCurrency(employee.salary)}/mo</span>
            </div>
          )}
          {employee.address && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{employee.address}</span>
            </div>
          )}
        </div>

        {(employee.emergency_contact || employee.emergency_phone) && (
          <div className="border-t pt-3 mt-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Emergency Contact
            </h4>
            <div className="flex items-center gap-4 text-sm">
              {employee.emergency_contact && <span>{employee.emergency_contact}</span>}
              {employee.emergency_phone && (
                <span className="text-muted-foreground">{employee.emergency_phone}</span>
              )}
            </div>
          </div>
        )}

        {employee.notes && (
          <div className="border-t pt-3 mt-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
            <p className="text-sm">{employee.notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function EmployeesPage() {
  const { employees, isLoading, addEmployee, updateEmployee, deleteEmployee, getStats } =
    useEmployees();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = getStats();

  const filteredEmployees = useMemo(() => {
    let result = [...employees];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.staff_id.toLowerCase().includes(q) ||
          (e.email && e.email.toLowerCase().includes(q)) ||
          (e.phone && e.phone.includes(q))
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((e) => e.role === roleFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((e) =>
        statusFilter === "active" ? e.is_active : !e.is_active
      );
    }

    result.sort((a, b) => {
      let aVal: string | number | boolean | null = a[sortField];
      let bVal: string | number | boolean | null = b[sortField];

      if (sortField === "salary") {
        aVal = a.salary ? parseFloat(a.salary) : 0;
        bVal = b.salary ? parseFloat(b.salary) : 0;
      }

      if (typeof aVal === "boolean") aVal = aVal ? 1 : 0;
      if (typeof bVal === "boolean") bVal = bVal ? 1 : 0;

      if (aVal === null) aVal = "";
      if (bVal === null) bVal = "";

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? comparison : -comparison;
    });

    return result;
  }, [employees, search, roleFilter, statusFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleAdd = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    try {
      const result = await addEmployee({
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        salary: data.salary || null,
        hire_date: data.hire_date || null,
        date_of_birth: data.date_of_birth || null,
        address: data.address || null,
        national_id: data.national_id || null,
        emergency_contact: data.emergency_contact || null,
        emergency_phone: data.emergency_phone || null,
        profile_image_url: null,
        shop_id: data.shop_id || null,
        notes: data.notes || null,
        is_active: true,
      });
      if (result) {
        setShowForm(false);
        toast({
          title: "Employee Added",
          description: `${data.name} has been added successfully.`,
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: EmployeeFormData) => {
    if (!editEmployee) return;
    setIsSubmitting(true);
    try {
      const result = await updateEmployee(editEmployee.staff_id, {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        salary: data.salary || null,
        hire_date: data.hire_date || null,
        date_of_birth: data.date_of_birth || null,
        address: data.address || null,
        national_id: data.national_id || null,
        emergency_contact: data.emergency_contact || null,
        emergency_phone: data.emergency_phone || null,
        shop_id: data.shop_id || null,
        notes: data.notes || null,
      });
      if (result) {
        setEditEmployee(null);
        toast({
          title: "Employee Updated",
          description: `${data.name} has been updated successfully.`,
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const success = await deleteEmployee(deleteTarget.staff_id);
      if (success) {
        setDeleteTarget(null);
        toast({
          title: "Employee Deleted",
          description: `${deleteTarget.name} has been removed.`,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={`h-3.5 w-3.5 ml-1 ${
        sortField === field ? "text-primary" : "text-muted-foreground/50"
      }`}
    />
  );

  return (
    <Layout pageTitle="Employees">
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Salary</p>
                  <p className="text-2xl font-bold">
                    {stats.averageSalary > 0
                      ? `OMR ${stats.averageSalary.toFixed(1)}`
                      : "—"}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Employee Table - Desktop */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-foreground"
                      onClick={() => handleSort("name")}
                    >
                      Employee <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-foreground"
                      onClick={() => handleSort("staff_id")}
                    >
                      ID <SortIcon field="staff_id" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-foreground"
                      onClick={() => handleSort("role")}
                    >
                      Role <SortIcon field="role" />
                    </button>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-foreground"
                      onClick={() => handleSort("salary")}
                    >
                      Salary <SortIcon field="salary" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-foreground"
                      onClick={() => handleSort("is_active")}
                    >
                      Status <SortIcon field="is_active" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="h-8 w-8 mb-2 opacity-50" />
                        <p>No employees found</p>
                        {(search || roleFilter !== "all" || statusFilter !== "all") && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setSearch("");
                              setRoleFilter("all");
                              setStatusFilter("all");
                            }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                              {getInitials(emp.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{emp.name}</div>
                            {emp.email && (
                              <div className="text-xs text-muted-foreground">
                                {emp.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {emp.staff_id}
                        </code>
                      </TableCell>
                      <TableCell>{getRoleBadge(emp.role)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {emp.phone && <div>{emp.phone}</div>}
                          {!emp.phone && <span className="text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(emp.salary)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={emp.is_active ? "default" : "secondary"}
                          className={
                            emp.is_active
                              ? "bg-green-100 text-green-800 border-none"
                              : "bg-gray-100 text-gray-600 border-none"
                          }
                        >
                          {emp.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewEmployee(emp)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditEmployee(emp)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(emp)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Employee Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredEmployees.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No employees found</p>
              </CardContent>
            </Card>
          ) : (
            filteredEmployees.map((emp) => (
              <Card key={emp.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(emp.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <code className="text-xs bg-muted px-1 rounded">
                            {emp.staff_id}
                          </code>
                          {getRoleBadge(emp.role)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={emp.is_active ? "default" : "secondary"}
                      className={
                        emp.is_active
                          ? "bg-green-100 text-green-800 border-none"
                          : "bg-gray-100 text-gray-600 border-none"
                      }
                    >
                      {emp.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {emp.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {emp.phone}
                      </div>
                    )}
                    {emp.email && (
                      <div className="flex items-center gap-1 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    )}
                    {emp.salary && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {formatCurrency(emp.salary)}/mo
                      </div>
                    )}
                    {emp.hire_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(emp.hire_date)}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewEmployee(emp)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditEmployee(emp)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive"
                      onClick={() => setDeleteTarget(emp)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground text-right">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[600px] max-w-[95vw] rounded-xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Fill in the employee details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog
        open={!!editEmployee}
        onOpenChange={(open) => !open && setEditEmployee(null)}
      >
        <DialogContent className="w-[600px] max-w-[95vw] rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update the employee information below.</DialogDescription>
          </DialogHeader>
          {editEmployee && (
            <EmployeeForm
              employee={editEmployee}
              onSubmit={handleEdit}
              onCancel={() => setEditEmployee(null)}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Employee Detail Dialog */}
      <EmployeeDetailDialog
        employee={viewEmployee}
        open={!!viewEmployee}
        onClose={() => setViewEmployee(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
