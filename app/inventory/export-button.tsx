"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { Item } from "./items-context"
import { toast } from "@/components/ui/use-toast"

interface ExportButtonProps {
  items: Item[]
}

export default function ExportButton({ items }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToCSV = () => {
    if (items.length === 0) {
      toast({
        title: "No items to export",
        description: "There are no items matching your current filters to export.",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)

    try {
      // Create CSV headers
      const headers = [
        "Name",
        "Brand",
        "Category",
        "Type",
        "Stock",
        "Price",
        "SKU",
        "Description"
      ]

      // Transform items to CSV rows
      const rows = items.map(item => [
        item.name,
        item.brand || "",
        item.category,
        item.type || "",
        item.stock.toString(),
        item.price.toString(),
        item.sku || "",
        item.description || ""
      ])

      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...rows.map(row => 
          row.map(cell => 
            // Handle commas and quotes in cell content
            cell.includes(",") ? `"${cell.replace(/"/g, '""')}"` : cell
          ).join(",")
        )
      ].join("\n")

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      
      // Set up and trigger download
      link.setAttribute("href", url)
      link.setAttribute("download", `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Export successful",
        description: `${items.length} items exported to CSV file.`
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={exportToCSV} 
      disabled={isExporting}
    >
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  )
} 