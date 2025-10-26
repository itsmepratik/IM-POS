"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Info,
  Upload,
  Download,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CustomerData } from "./customer-form";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (customers: Omit<CustomerData, "id" | "lastVisit">[]) => void;
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setParsedData(null);
    setError(null);
    setSuccess(false);
  };

  const validateAndParseFile = () => {
    if (!file) {
      setError("No file selected");
      return;
    }

    setIsValidating(true);
    setError(null);
    setParsedData(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        // Try to parse as JSON
        const data = JSON.parse(content);

        // Validate data is an array
        if (!Array.isArray(data)) {
          throw new Error("Import data must be an array of customers");
        }

        // Validate each customer
        const validCustomers = data.filter((customer, index) => {
          if (!customer.name || !customer.phone) {
            console.warn(`Customer at index ${index} missing required fields`);
            return false;
          }

          // Normalize the vehicles array
          if (!customer.vehicles) {
            customer.vehicles = [];
          }

          // Validate and normalize each vehicle
          customer.vehicles = customer.vehicles.filter((vehicle: any) => {
            if (!vehicle.make || !vehicle.model) {
              console.warn(
                `Vehicle in customer ${customer.name} missing required fields`
              );
              return false;
            }

            // Ensure vehicle has an ID
            if (!vehicle.id) {
              vehicle.id =
                Date.now().toString() +
                Math.random().toString(36).substring(2, 9);
            }

            return true;
          });

          return true;
        });

        setParsedData(validCustomers);

        if (validCustomers.length === 0) {
          throw new Error("No valid customers found in the import file");
        }

        if (validCustomers.length !== data.length) {
          setError(
            `Warning: Only ${validCustomers.length} out of ${data.length} customers are valid and will be imported`
          );
        }

        setSuccess(true);
      } catch (error) {
        console.error("Import error:", error);
        setError(
          `Error parsing file: ${
            error instanceof Error ? error.message : "Invalid format"
          }`
        );
        setParsedData(null);
        setSuccess(false);
      } finally {
        setIsValidating(false);
      }
    };

    reader.onerror = () => {
      setError("Error reading file");
      setIsValidating(false);
      setSuccess(false);
    };

    reader.readAsText(file);
  };

  const handleImport = () => {
    if (parsedData && parsedData.length > 0) {
      onImport(parsedData);
      onClose();
    }
  };

  const downloadSampleFile = () => {
    const sampleData = [
      {
        name: "Sample Customer",
        email: "sample@example.com",
        phone: "(555) 123-4567",
        address: "123 Sample St, City, State, 12345",
        notes: "This is a sample customer",
        vehicles: [
          {
            id: "sample-v1",
            make: "Toyota",
            model: "Camry",
            year: "2020",
            plateNumber: "SAMPLE1",
            vin: "1HGCM82633A123456",
            notes: "Sample vehicle notes",
          },
        ],
      },
    ];

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_customers_import.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Import Customers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Import Format</AlertTitle>
            <AlertDescription>
              Upload a JSON file containing customer data.
              <Button
                variant="link"
                className="h-auto p-0 text-primary"
                onClick={downloadSampleFile}
              >
                <Download className="h-3 w-3 mr-1" />
                Download sample file
              </Button>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="customers-file">Select File</Label>
            <div className="flex gap-2">
              <Input
                id="customers-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={validateAndParseFile}
                disabled={!file || isValidating}
              >
                {isValidating ? "Validating..." : "Validate"}
              </Button>
            </div>
          </div>

          {file && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              {file.name} ({Math.round(file.size / 1024)} KB)
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && parsedData && (
            <Alert
              variant="success"
              className="bg-green-50 border-green-200 text-green-800"
            >
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Ready to Import</AlertTitle>
              <AlertDescription>
                {parsedData.length} customer{parsedData.length !== 1 ? "s" : ""}{" "}
                ready to import
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!success || !parsedData || parsedData.length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Customers
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
