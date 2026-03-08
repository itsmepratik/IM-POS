"use client";

import { Download, FileText, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonsProps {
  data: any[];
  filename: string;
  headers?: string[]; // Optional since we dynamically extract keys
  mapDataFn: (data: any[]) => any[]; // Function to map complex data into flat array for CSV
  reportName?: string; // e.g., "Revenue Report", "Profits Report"
  className?: string; // Useful for hiding these buttons during print via 'print:hidden'
}

export function ExportButtons({
  data,
  filename,
  mapDataFn,
  reportName = "Report",
  className = "",
}: ExportButtonsProps) {
  const handleExportCSV = () => {
    // 1. Map data into flat format
    const flatData = mapDataFn(data);

    if (flatData.length === 0) {
      alert("No data available to export.");
      return;
    }

    // 2. Extract headers from the first mapped object
    const headers = Object.keys(flatData[0]);

    // 3. Build CSV string
    const csvRows = [];
    // Push header row
    csvRows.push(headers.map((header) => `"${header}"`).join(","));

    // Push data rows
    for (const row of flatData) {
      const values = headers.map((header) => {
        const val = row[header];
        // Handle undefined, null, and escape inner quotes
        const escaped = ("" + (val ?? "")).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link); // Required for FF

    link.click();

    // Clean up
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    // We rely on window.print() combined with @media print CSS rules
    // to render the page elegantly as a PDF.

    // Optionally update document title temporarily for the default save filename
    const originalTitle = document.title;
    document.title = `${filename}_${new Date().toISOString().split("T")[0]}`;

    window.print();

    // Restore original title
    document.title = originalTitle;
  };

  return (
    <div className={`flex items-center ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 px-0">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open export menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onAction={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            <span>Export CSV</span>
          </DropdownMenuItem>
          <DropdownMenuItem onAction={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Export PDF</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
