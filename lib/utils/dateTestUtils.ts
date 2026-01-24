/**
 * Date Testing Utilities
 *
 * Provides comprehensive testing for manufacturing date functionality
 * including various date formats and edge cases.
 */

import {
  formatDateForInput,
  getDateValidationInfo,
  isValidDateString,
  isFutureDate,
  isTooOldDate,
} from "./dateUtils";

export interface DateTestResult {
  input: string | Date | null | undefined;
  formatted: string | null;
  isValid: boolean;
  validation: any;
  success: boolean;
  error?: string;
}

export interface DateTestSuiteResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: DateTestResult[];
  summary: {
    validDates: number;
    invalidDates: number;
    futureDates: number;
    oldDates: number;
  };
}

/**
 * Test various date formats and edge cases
 */
export function testDateFormatting(): DateTestSuiteResult {
  const testCases = [
    // Valid cases
    { name: "YYYY-MM-DD format", input: "2024-01-15" },
    { name: "DD/MM/YYYY format", input: "15/01/2024" },
    { name: "Date object", input: new Date("2024-01-15") },
    { name: "ISO string", input: "2024-01-15T00:00:00.000Z" },
    { name: "Current date", input: new Date() },

    // Edge cases
    { name: "Empty string", input: "" },
    { name: "Null value", input: null },
    { name: "Undefined value", input: undefined },
    { name: "Invalid string", input: "invalid-date" },
    { name: "Future date", input: "2030-12-31" },
    { name: "Very old date", input: "1950-01-01" },

    // Database timestamp formats
    { name: "PostgreSQL timestamp", input: "2024-01-15 10:30:00+00" },
    { name: "Database date only", input: "2024-01-15" },
  ];

  const results: DateTestResult[] = [];
  let validDates = 0;
  let invalidDates = 0;
  let futureDates = 0;
  let oldDates = 0;

  console.group("🧪 Manufacturing Date Format Tests");

  for (const testCase of testCases) {
    try {
      const formatted = formatDateForInput(testCase.input);
      const validation = getDateValidationInfo(testCase.input as string);
      const isValid = validation.isValid;

      if (isValid) validDates++;
      else invalidDates++;

      if (validation.isFuture) futureDates++;
      if (validation.isTooOld) oldDates++;

      const result: DateTestResult = {
        input: testCase.input,
        formatted,
        isValid,
        validation,
        success: true,
      };

      results.push(result);
    } catch (error) {
      const result: DateTestResult = {
        input: testCase.input,
        formatted: null,
        isValid: false,
        validation: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      results.push(result);
      invalidDates++;

      console.error(`❌ ${testCase.name}:`, error);
    }
  }

  console.groupEnd();

  const passedTests = results.filter((r) => r.success).length;
  const failedTests = results.length - passedTests;

  return {
    totalTests: results.length,
    passedTests,
    failedTests,
    results,
    summary: {
      validDates,
      invalidDates,
      futureDates,
      oldDates,
    },
  };
}

/**
 * Test manufacturing date field in item modal format
 */
export function testManufacturingDateField(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  return new Promise((resolve) => {

    try {
      const testSuite = testDateFormatting();

      const success = testSuite.passedTests === testSuite.totalTests;

      resolve({
        success,
        message: success
          ? "All manufacturing date tests passed"
          : `${testSuite.failedTests} tests failed`,
        details: testSuite,
      });
    } catch (error) {
      resolve({
        success: false,
        message: `Test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  });
}

/**
 * Validate a specific manufacturing date
 */
export function validateManufacturingDate(
  dateValue: string | Date | null | undefined
): {
  isValid: boolean;
  formatted: string | null;
  message: string;
  validation: any;
} {
  const validation = getDateValidationInfo(dateValue as string);

  return {
    isValid: validation.isValid,
    formatted: validation.formatted,
    message: validation.message,
    validation,
  };
}

/**
 * Run comprehensive date tests and log results to console
 */
export function runDateTests(): void {

  const testSuite = testDateFormatting();
  testSuite.results.forEach((result, index) => {
    const status = result.success ? "✅" : "❌";
  });
}

/**
 * Debug helper function for browser console
 */
export function debugManufacturingDate(): void {

  // Run tests automatically
  runDateTests();
}

// Make debug function available globally for browser console access
if (typeof window !== "undefined") {
  (window as any).debugManufacturingDate = debugManufacturingDate;
  (window as any).testManufacturingDate = testManufacturingDateField;
  (window as any).validateManufacturingDate = validateManufacturingDate;
  (window as any).checkDatabaseDates = async () => {
    const { verifyDatabaseConnection, getSampleData } = await import(
      "./databaseVerification"
    );
    const connectionResult = await verifyDatabaseConnection();
    const sampleData = await getSampleData();
    return { connectionResult, sampleData };
  };

  (window as any).setupManufacturingDates = async () => {
    const { setupSampleManufacturingDates } = await import(
      "./setupManufacturingDates"
    );
    return await setupSampleManufacturingDates();
  };

  (window as any).clearManufacturingDates = async () => {
    const { clearManufacturingDates } = await import(
      "./setupManufacturingDates"
    );
    return await clearManufacturingDates();
  };

  (window as any).checkCoverage = async () => {
    const { checkManufacturingDateCoverage } = await import(
      "./setupManufacturingDates"
    );
    return await checkManufacturingDateCoverage();
  };

  (window as any).testManufacturingDateDisplay = async () => {

    // Test database connection and data
    const dbResult = await (window as any).checkDatabaseDates();

    // Test date formatting
    const formatTests = testDateFormatting();

    // Test if items are being fetched with manufacturing dates
    try {
      const { fetchItems } = await import("../services/inventoryService");
      const items = await fetchItems("sanaiya");

      const itemsWithDates = items.filter((item) => item.manufacturingDate);

      return {
        success:
          formatTests.passedTests === formatTests.totalTests &&
          itemsWithDates.length > 0,
        databaseResult: dbResult,
        formatTests: formatTests,
        itemsWithDates: itemsWithDates.length,
        totalItems: items.length,
      };
    } catch (error) {
      console.error("❌ Error testing manufacturing date display:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        databaseResult: dbResult,
        formatTests: formatTests,
        itemsWithDates: 0,
        totalItems: 0,
      };
    }
  };
}
