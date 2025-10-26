/**
 * Date Input Component
 *
 * Enhanced date input with proper formatting, error handling, and visual confirmation
 */

"use client";

import React, { useState, useEffect } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { getDateValidationInfo } from "@/lib/utils/dateUtils";

interface DateInputProps
  extends Omit<React.ComponentProps<"input">, "onChange"> {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  showValidation?: boolean;
}

export function DateInput({
  label,
  value = "",
  onChange,
  error,
  showValidation = true,
  className,
  id,
  ...props
}: DateInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  // Sync internal value with prop value
  useEffect(() => {
    console.log(`DateInput ${id} - Value changed:`, value, typeof value);

    // Ensure the value is in the correct format for HTML date input
    let formattedValue = value;
    if (value && typeof value === "string") {
      // If it's already in YYYY-MM-DD format, use it
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        formattedValue = value;
      } else {
        // Try to parse and format the date
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            formattedValue = date.toISOString().split("T")[0];
            console.log(`DateInput ${id} - Formatted date:`, formattedValue);
          }
        } catch (error) {
          console.warn(`DateInput ${id} - Error parsing date:`, error);
          formattedValue = "";
        }
      }
    } else if (!value) {
      formattedValue = "";
    }

    // Force re-render if the value changes significantly
    const hasValueChanged = internalValue !== formattedValue;
    setInternalValue(formattedValue);
    setIsLoaded(true);

    if (hasValueChanged && formattedValue) {
      // Force a re-render to ensure the browser updates the display
      setRenderKey((prev) => prev + 1);
    }
  }, [value, id, internalValue]);

  // Validate date format
  useEffect(() => {
    if (internalValue && internalValue.trim() !== "") {
      const validation = getDateValidationInfo(internalValue);
      setIsValid(validation.isValid);

      // Log validation for debugging
      if (!validation.isValid) {
        console.warn(`Invalid date format: ${internalValue}`, validation);
      } else {
        console.log(`DateInput ${id} validation:`, validation);
      }
    } else {
      setIsValid(true); // Empty value is considered valid
    }
  }, [internalValue, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const getBorderColor = () => {
    if (error) return "border-destructive";
    if (
      showValidation &&
      isLoaded &&
      internalValue &&
      internalValue.trim() !== ""
    ) {
      return isValid ? "border-green-500" : "border-orange-500";
    }
    return "border-input";
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="flex items-center gap-2">
          {label}
          {showValidation &&
            isLoaded &&
            internalValue &&
            internalValue.trim() !== "" &&
            (isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            ))}
          {showValidation &&
            isLoaded &&
            internalValue &&
            internalValue.trim() !== "" && (
              <Calendar className="h-4 w-4 text-muted-foreground" />
            )}
        </Label>
      )}
      <div className="relative">
        <Input
          key={`date-input-${renderKey}`}
          id={id}
          type="date"
          value={internalValue}
          onChange={handleChange}
          className={cn("transition-colors", getBorderColor(), className)}
          placeholder={props.placeholder || ""}
          {...props}
        />
        {showValidation &&
          isLoaded &&
          internalValue &&
          internalValue.trim() !== "" &&
          !isValid && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
          )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {showValidation &&
        isLoaded &&
        internalValue &&
        internalValue.trim() !== "" &&
        !isValid && (
          <p className="text-sm text-orange-600">
            {(() => {
              const validation = getDateValidationInfo(internalValue);
              return (
                validation.message ||
                "Invalid date format. Please use YYYY-MM-DD format."
              );
            })()}
          </p>
        )}
    </div>
  );
}
