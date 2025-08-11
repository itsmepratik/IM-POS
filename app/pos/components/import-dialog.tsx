"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (importedData: { id: number; name: string; price: number }[]) => void
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  // In a real app, you would implement file uploading and parsing logic here
  
  const handleImport = () => {
    // Here we'd normally parse a file and import the data
    // For now, we'll just simulate it with mock data
    const mockImportData = [
      { id: 1, name: "Sample Import Item 1", price: 19.99 },
      { id: 2, name: "Sample Import Item 2", price: 29.99 }
    ]
    
    onImport(mockImportData)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-[500px] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Import Data</DialogTitle>
        </DialogHeader>
        
        <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            This is a placeholder for file import functionality
          </p>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 