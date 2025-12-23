"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Image as ImageIcon, FileImage, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onRemove?: () => void;
  value?: string | null;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  onUpload,
  onRemove,
  value,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    if (!file) return;

    // Reset error
    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      const msg = "Invalid file type. Please upload an image (PNG, JPG, WEBP).";
      setError(msg);
      toast({
        title: "Invalid file",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const msg = "File too large. Maximum size is 5MB.";
      setError(msg);
      toast({
        title: "File too large",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Simulate progress for better UX since Supabase client doesn't provide upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const { error: uploadError } = await supabase.storage
        .from("Product Images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      setProgress(100);

      const {
        data: { publicUrl },
      } = supabase.storage.from("Product Images").getPublicUrl(filePath);

      onUpload(publicUrl);
      
      toast({
        title: "Image uploaded",
        description: "Product image has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      const msg = "Failed to upload image. Please try again.";
      setError(msg);
      toast({
        title: "Upload failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset progress after a short delay
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        await uploadFile(file);
      }
    },
    [disabled]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
    // Reset input value so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    setError(null);
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 h-48 w-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Product"
            className="h-full w-full object-contain"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {!disabled && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 w-8 p-0"
                >
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Change</span>
                </Button>
                {onRemove && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-60 cursor-not-allowed hover:bg-transparent hover:border-muted-foreground/25",
            error && "border-destructive/50 bg-destructive/5",
            className
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center w-full h-full p-4 gap-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <div className="h-12 w-12" />
              </div>
              <div className="w-full max-w-[60%] space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground animate-pulse">
                  Uploading... {progress}%
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
              <div
                className={cn(
                  "p-3 rounded-full bg-muted transition-transform duration-200",
                  isDragging ? "scale-110 bg-background" : "group-hover:scale-105",
                  error && "bg-destructive/10 text-destructive"
                )}
              >
                {isDragging ? (
                  <FileImage className="h-6 w-6 text-primary" />
                ) : (
                  <Upload className={cn("h-6 w-6 text-muted-foreground", error && "text-destructive")} />
                )}
              </div>
              <div className="space-y-1">
                <p className={cn("text-sm font-medium", error && "text-destructive font-semibold")}>
                  {error ? error : isDragging ? "Drop image here" : "Click or drag image"}
                </p>
                <p className="text-xs text-muted-foreground">
                  SVG, PNG, JPG or GIF (max. 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
