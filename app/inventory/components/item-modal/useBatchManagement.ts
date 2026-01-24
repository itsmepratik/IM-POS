"use client";

// Batch management hook for item-modal
// Extracted from item-modal.tsx

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import type { Batch } from "../../items-context";
import type { ExtendedItem, NewBatchForm } from "./types";

interface UseBatchManagementProps {
  item?: { id: string; product_id?: string } | null;
  formData: ExtendedItem;
  setFormData: React.Dispatch<React.SetStateAction<ExtendedItem>>;
  addBatch: (itemId: string, batch: NewBatchForm) => Promise<boolean>;
  updateBatch: (itemId: string, batchId: string, batch: NewBatchForm) => void;
  deleteBatch: (itemId: string, batchId: string) => Promise<boolean>;
}

interface UseBatchManagementReturn {
  newBatch: NewBatchForm;
  setNewBatch: React.Dispatch<React.SetStateAction<NewBatchForm>>;
  editingBatchId: string | null;
  setEditingBatchId: React.Dispatch<React.SetStateAction<string | null>>;
  isEditingBatch: boolean;
  setIsEditingBatch: React.Dispatch<React.SetStateAction<boolean>>;
  editingBatch: Batch;
  setEditingBatch: React.Dispatch<React.SetStateAction<Batch>>;
  handleAddBatch: () => Promise<void>;
  handleUpdateBatch: () => void;
  handleDeleteBatch: (batchId: string) => Promise<void>;
  handleEditBatch: (batch: Batch) => void;
  handleCancelEdit: () => void;
  calculateBatchAge: (purchaseDate: string) => number;
  getBatchFifoPosition: (batchIndex: number, totalBatches: number) => string;
  resetBatchState: () => void;
}

export function useBatchManagement({
  item,
  formData,
  setFormData,
  addBatch,
  updateBatch,
  deleteBatch,
}: UseBatchManagementProps): UseBatchManagementReturn {
  const [newBatch, setNewBatch] = useState<NewBatchForm>({
    item_id: "",
    purchase_date: "",
    expiration_date: null,
    supplier_id: null,
    cost_price: 0,
    initial_quantity: 0,
    current_quantity: 0,
    created_at: null,
    updated_at: null,
  });

  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch>({
    id: "",
    item_id: "",
    purchase_date: "",
    expiration_date: null,
    supplier_id: null,
    cost_price: 0,
    initial_quantity: 0,
    current_quantity: 0,
    created_at: null,
    updated_at: null,
  });

  const resetBatchState = useCallback(() => {
    setNewBatch({
      item_id: "",
      purchase_date: format(new Date(), "yyyy-MM-dd"),
      expiration_date: null,
      supplier_id: null,
      cost_price: 0,
      initial_quantity: 0,
      current_quantity: 0,
      created_at: null,
      updated_at: null,
      purchaseDate: format(new Date(), "yyyy-MM-dd"),
      costPrice: 0,
      quantity: 0,
    });
    setEditingBatchId(null);
    setIsEditingBatch(false);
    setEditingBatch({
      id: "",
      item_id: "",
      purchase_date: "",
      expiration_date: null,
      supplier_id: null,
      cost_price: 0,
      initial_quantity: 0,
      current_quantity: 0,
      created_at: null,
      updated_at: null,
    });
  }, []);

  const handleAddBatch = useCallback(async () => {
    if (!newBatch.purchaseDate || !newBatch.quantity) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!item) {
      // Adding batch to a new item (local state only)
      const newBatchWithId: Batch = {
        id: uuidv4(),
        ...newBatch,
        purchase_date: newBatch.purchaseDate || newBatch.purchase_date || new Date().toISOString(),
        item_id: "",
        current_quantity: newBatch.quantity,
        initial_quantity: newBatch.quantity,
      };

      const updatedBatches = [...(formData.batches || []), newBatchWithId].sort(
        (a, b) =>
          new Date(a.purchase_date || "").getTime() -
          new Date(b.purchase_date || "").getTime()
      );

      setFormData((prev) => ({
        ...prev,
        batches: updatedBatches,
        stock: updatedBatches.reduce((sum, batch) => sum + (batch.current_quantity || 0), 0),
      }));

      setNewBatch({
        ...newBatch,
        purchaseDate: format(new Date(), "yyyy-MM-dd"),
        costPrice: 0,
        quantity: 0,
      });

      toast({
        title: "Batch added",
        description: "Batch added to list. Save item to persist.",
      });
      return;
    }

    try {
      const success = await addBatch(item.id, newBatch);

      if (success) {
        const newBatchWithId: Batch = {
          id: uuidv4(),
          ...newBatch,
          item_id: item.id,
        };

        const updatedBatches = [...(formData.batches || []), newBatchWithId].sort(
          (a, b) =>
            new Date(a.purchase_date || "").getTime() -
            new Date(b.purchase_date || "").getTime()
        );

        setFormData((prev) => ({
          ...prev,
          batches: updatedBatches,
          stock: updatedBatches.reduce((sum, batch) => sum + (batch.current_quantity || 0), 0),
        }));

        setNewBatch({
          ...newBatch,
          purchaseDate: format(new Date(), "yyyy-MM-dd"),
          costPrice: 0,
          quantity: 0,
        });

        toast({
          title: "Batch added",
          description: "The batch has been added successfully.",
        });
      }
    } catch (error) {
      console.error("Error adding batch:", error);
      toast({
        title: "Error adding batch",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add batch. Please try again.",
        variant: "destructive",
      });
    }
  }, [newBatch, item, formData.batches, setFormData, addBatch]);

  const handleUpdateBatch = useCallback(() => {
    if (!editingBatchId) return;

    if (item) {
      updateBatch(item.id, editingBatchId, newBatch);
    }

    const currentBatches = formData.batches || [];
    const updatedBatches = currentBatches.map((batch) =>
      batch.id === editingBatchId
        ? {
            ...batch,
            ...newBatch,
            purchase_date: newBatch.purchaseDate || newBatch.purchase_date || batch.purchase_date,
            current_quantity: newBatch.quantity || batch.current_quantity,
            initial_quantity: newBatch.quantity || batch.initial_quantity,
          }
        : batch
    );

    const sortedBatches = updatedBatches.sort(
      (a, b) =>
        new Date(a.purchase_date || "").getTime() -
        new Date(b.purchase_date || "").getTime()
    );

    setFormData((prev) => ({
      ...prev,
      batches: sortedBatches,
      stock: sortedBatches.reduce((sum, batch) => sum + (batch.current_quantity || 0), 0),
    }));

    setEditingBatchId(null);
    setNewBatch({
      ...newBatch,
      purchaseDate: format(new Date(), "yyyy-MM-dd"),
      costPrice: 0,
      quantity: 0,
    });
  }, [editingBatchId, item, newBatch, formData.batches, setFormData, updateBatch]);

  const handleDeleteBatch = useCallback(async (batchId: string) => {
    if (!item) {
      const remainingBatches = (formData.batches || []).filter(
        (batch) => batch.id !== batchId
      );

      setFormData((prev) => ({
        ...prev,
        batches: remainingBatches,
        stock: remainingBatches.reduce((sum, batch) => sum + (batch.current_quantity || 0), 0),
      }));
      return;
    }

    if (!window.confirm("Are you sure you want to delete this batch? This action cannot be undone.")) {
      return;
    }

    try {
      const success = await deleteBatch(item.id, batchId);

      if (success) {
        const remainingBatches = (formData.batches || []).filter(
          (batch) => batch.id !== batchId
        );

        setFormData((prev) => ({
          ...prev,
          batches: remainingBatches,
          stock: remainingBatches.reduce((sum, batch) => sum + (batch.current_quantity || 0), 0),
        }));

        toast({
          title: "Batch deleted",
          description: "The batch has been deleted successfully.",
        });
      }
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast({
        title: "Error deleting batch",
        description: "Failed to delete batch. Please try again.",
        variant: "destructive",
      });
    }
  }, [item, formData.batches, setFormData, deleteBatch]);

  const handleEditBatch = useCallback((batch: Batch) => {
    setEditingBatchId(batch.id);
    setIsEditingBatch(true);
    setEditingBatch(batch);
    setNewBatch({
      ...batch,
      purchaseDate: batch.purchase_date || "",
      costPrice: batch.cost_price || 0,
      quantity: batch.current_quantity || 0,
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingBatchId(null);
    setIsEditingBatch(false);
    setNewBatch({
      item_id: "",
      purchase_date: format(new Date(), "yyyy-MM-dd"),
      expiration_date: null,
      supplier_id: null,
      cost_price: 0,
      initial_quantity: 0,
      current_quantity: 0,
      created_at: null,
      updated_at: null,
      purchaseDate: format(new Date(), "yyyy-MM-dd"),
      costPrice: 0,
      quantity: 0,
    });
  }, []);

  const calculateBatchAge = useCallback((purchaseDate: string): number => {
    if (!purchaseDate) return 0;
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchase.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const getBatchFifoPosition = useCallback((batchIndex: number, totalBatches: number): string => {
    if (totalBatches === 0) return "";
    if (batchIndex === 0) return "First (Active)";
    if (batchIndex === totalBatches - 1) return "Last";
    return `#${batchIndex + 1}`;
  }, []);

  return {
    newBatch,
    setNewBatch,
    editingBatchId,
    setEditingBatchId,
    isEditingBatch,
    setIsEditingBatch,
    editingBatch,
    setEditingBatch,
    handleAddBatch,
    handleUpdateBatch,
    handleDeleteBatch,
    handleEditBatch,
    handleCancelEdit,
    calculateBatchAge,
    getBatchFifoPosition,
    resetBatchState,
  };
}
