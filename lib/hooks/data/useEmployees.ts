import { useState, useCallback, useEffect } from "react";

export interface Employee {
  id: string;
  staff_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  salary: string | null;
  hire_date: string | null;
  date_of_birth: string | null;
  address: string | null;
  national_id: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  profile_image_url: string | null;
  shop_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
  averageSalary: number;
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/staff");
      const result = await response.json();

      if (result.success) {
        setEmployees(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch employees");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEmployee = useCallback(
    async (data: Omit<Employee, "id" | "created_at" | "updated_at">) => {
      try {
        const response = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          setEmployees((prev) => [...prev, result.data]);
          return result.data as Employee;
        } else {
          throw new Error(result.error || "Failed to add employee");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to add employee")
        );
        return null;
      }
    },
    []
  );

  const updateEmployee = useCallback(
    async (staffId: string, data: Partial<Employee>) => {
      try {
        const response = await fetch(`/api/staff/${staffId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          setEmployees((prev) =>
            prev.map((e) =>
              e.staff_id === staffId ? { ...e, ...result.data } : e
            )
          );
          return result.data as Employee;
        } else {
          throw new Error(result.error || "Failed to update employee");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to update employee")
        );
        return null;
      }
    },
    []
  );

  const deleteEmployee = useCallback(async (staffId: string) => {
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setEmployees((prev) => prev.filter((e) => e.staff_id !== staffId));
        return true;
      } else {
        throw new Error(result.error || "Failed to delete employee");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to delete employee")
      );
      return false;
    }
  }, []);

  const getStats = useCallback((): EmployeeStats => {
    const total = employees.length;
    const active = employees.filter((e) => e.is_active).length;
    const inactive = total - active;

    const byRole: Record<string, number> = {};
    for (const emp of employees) {
      byRole[emp.role] = (byRole[emp.role] || 0) + 1;
    }

    const salaries = employees
      .map((e) => (e.salary ? parseFloat(e.salary) : 0))
      .filter((s) => s > 0);
    const averageSalary =
      salaries.length > 0
        ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length
        : 0;

    return { total, active, inactive, byRole, averageSalary };
  }, [employees]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    isLoading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getStats,
    refreshEmployees: fetchEmployees,
  };
}
