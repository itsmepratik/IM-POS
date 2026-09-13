import { describe, it, expect } from "vitest";
import { formatDateForInput } from "./dateUtils";

/**
 * Regression tests for: "purchase date shows mm/dd/yyyy placeholder when
 * editing an existing batch".
 *
 * Root cause: batches.purchase_date is a timestamptz column, so Supabase
 * returns full ISO strings ("2026-09-10T00:00:00+00:00"). A native
 * <input type="date"> only renders YYYY-MM-DD, so the raw value displayed
 * as an empty field. The Edit Batch dialog must always normalize through
 * formatDateForInput before storing, rendering, and saving.
 */
describe("formatDateForInput - Edit Batch purchase date", () => {
  it("converts DB timestamptz values to YYYY-MM-DD for the date input", () => {
    expect(formatDateForInput("2026-09-10T00:00:00+00:00")).toBe("2026-09-10");
    expect(formatDateForInput("2026-09-10T07:00:00.000Z")).toBe("2026-09-10");
    expect(formatDateForInput("2026-09-10 00:00:00+00")).toBe("2026-09-10");
  });

  it("passes date-only values through untouched", () => {
    expect(formatDateForInput("2026-09-10")).toBe("2026-09-10");
  });

  it("treats slash dates as MM/DD/YYYY, matching the batch list display", () => {
    // Batch cards render via toLocaleDateString() (US), so "9/10/2026"
    // means September 10 — never October 9.
    expect(formatDateForInput("9/10/2026")).toBe("2026-09-10");
    expect(formatDateForInput("09/10/2026")).toBe("2026-09-10");
  });

  it("rejects impossible calendar dates instead of leaking them to the input", () => {
    expect(formatDateForInput("2026-13-01")).toBeNull();
    expect(formatDateForInput("2026-02-30")).toBeNull();
    expect(formatDateForInput("not-a-date")).toBeNull();
  });

  it("returns null for empty values so callers can fall back safely", () => {
    expect(formatDateForInput("")).toBeNull();
    expect(formatDateForInput("   ")).toBeNull();
    expect(formatDateForInput(null)).toBeNull();
    expect(formatDateForInput(undefined)).toBeNull();
  });

  it("formats Date objects in local time without a UTC off-by-one", () => {
    expect(formatDateForInput(new Date(2026, 8, 10))).toBe("2026-09-10");
  });

  it("dialog contract: open -> display -> save always stays YYYY-MM-DD", () => {
    const dbValue = "2026-09-10T00:00:00+00:00";

    // 1. pencil click: stored into editingBatch
    const storedOnOpen = formatDateForInput(dbValue) ?? "";
    expect(storedOnOpen).toBe("2026-09-10");

    // 2. render: <Input type="date" value={...}>
    const inputValue = formatDateForInput(storedOnOpen) ?? "";
    expect(inputValue).toBe("2026-09-10");
    expect(inputValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // 3. save: persisted back to context / DB
    const saved = formatDateForInput(inputValue) ?? "fallback-today";
    expect(saved).toBe("2026-09-10");
  });
});
