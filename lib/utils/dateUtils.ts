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
    return null;
  }

  try {
    if (typeof dateValue === "string") {
      const trimmed = dateValue.trim();
      if (!trimmed) return null;

      // Already in YYYY-MM-DD format — validate it is a real calendar date.
      const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
      if (ymdMatch) {
        const year = Number(ymdMatch[1]);
        const month = Number(ymdMatch[2]);
        const day = Number(ymdMatch[3]);
        return isValidCalendarDate(year, month, day)
          ? toInputFormat(year, month, day)
          : null;
      }

      // ISO / timestamptz strings from the database, e.g.
      // "2026-09-10T00:00:00+00:00" or "2026-09-10 00:00:00+00".
      // A native <input type="date"> only accepts YYYY-MM-DD, which is
      // why the raw value must never be passed through untouched.
      const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
      if (isoMatch) {
        const year = Number(isoMatch[1]);
        const month = Number(isoMatch[2]);
        const day = Number(isoMatch[3]);
        return isValidCalendarDate(year, month, day)
          ? toInputFormat(year, month, day)
          : null;
      }

      // Slash dates are MM/DD/YYYY (US), matching how batches are
      // displayed via toLocaleDateString(). There is intentionally no
      // DD/MM branch: it would shadow this one and swap month/day for
      // zero-padded dates like "09/10/2026".
      const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
      if (slashMatch) {
        const month = Number(slashMatch[1]);
        const day = Number(slashMatch[2]);
        const year = Number(slashMatch[3]);
        return isValidCalendarDate(year, month, day)
          ? toInputFormat(year, month, day)
          : null;
      }

      // Try to parse any other string as a date using local year/month/day
      // (avoids the UTC off-by-one of toISOString().split("T")[0]).
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return toInputFormat(
          parsed.getFullYear(),
          parsed.getMonth() + 1,
          parsed.getDate()
        );
      }
    } else if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return toInputFormat(
        dateValue.getFullYear(),
        dateValue.getMonth() + 1,
        dateValue.getDate()
      );
    }

    return null;
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
 * Returns true if year/month/day form a real calendar date.
 */
function isValidCalendarDate(
  year: number,
  month: number,
  day: number
): boolean {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

function toInputFormat(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
