/**
 * Date Utilities
 *
 * Provides comprehensive date formatting and validation utilities
 * for handling manufacturing dates and other date fields.
 */

/**
 * Formats a date value for HTML date input (YYYY-MM-DD)
 */
export function formatDateForInput(
  dateValue: string | Date | null | undefined
): string | null {
  if (!dateValue) {
    console.log("formatDateForInput: No date value provided");
    return null;
  }

  try {
    console.log("formatDateForInput: Raw input:", dateValue, typeof dateValue);

    let date: Date;

    if (typeof dateValue === "string") {
      // If it's already in YYYY-MM-DD format, use it directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        console.log(
          "formatDateForInput: Already in YYYY-MM-DD format:",
          dateValue
        );
        return dateValue;
      }

      // If it's in DD/MM/YYYY format, convert it
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
        const parts = dateValue.split("/");
        const converted = `${parts[2]}-${parts[1].padStart(
          2,
          "0"
        )}-${parts[0].padStart(2, "0")}`;
        console.log(
          "formatDateForInput: Converted DD/MM/YYYY to YYYY-MM-DD:",
          dateValue,
          "->",
          converted
        );
        return converted;
      }

      // Try to parse the string as a date
      date = new Date(dateValue);
    } else {
      date = dateValue;
    }

    if (isNaN(date.getTime())) {
      console.warn("formatDateForInput: Invalid date object:", dateValue);
      return null;
    }

    const formatted = date.toISOString().split("T")[0];
    console.log("formatDateForInput: Formatted to YYYY-MM-DD:", formatted);
    return formatted;
  } catch (error) {
    console.error(
      "formatDateForInput: Error formatting date:",
      error,
      "Input:",
      dateValue
    );
    return null;
  }
}

/**
 * Validates if a string is a valid date
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== "string") return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Checks if a date is in the future
 */
export function isFutureDate(dateString: string): boolean {
  if (!isValidDateString(dateString)) return false;

  const date = new Date(dateString);
  const now = new Date();
  return date > now;
}

/**
 * Checks if a date is too old (more than 50 years ago)
 */
export function isTooOldDate(dateString: string): boolean {
  if (!isValidDateString(dateString)) return false;

  const date = new Date(dateString);
  const fiftyYearsAgo = new Date();
  fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50);
  return date < fiftyYearsAgo;
}

/**
 * Gets date validation info
 */
export function getDateValidationInfo(dateString: string | null | undefined) {
  if (!dateString) {
    return {
      isValid: false,
      isEmpty: true,
      message: "No date provided",
    };
  }

  const formatted = formatDateForInput(dateString);
  const isValid = formatted !== null;
  const isFuture = isValid && formatted ? isFutureDate(formatted) : false;
  const isTooOld = isValid && formatted ? isTooOldDate(formatted) : false;

  let message = "Valid date";
  if (isFuture) message = "Future date";
  if (isTooOld) message = "Date is more than 50 years old";

  return {
    isValid,
    isEmpty: false,
    formatted,
    isFuture,
    isTooOld,
    message,
  };
}
