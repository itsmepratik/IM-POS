/**
 * Bill Number Service
 *
 * Handles structured bill number generation for the POS system with the following formats:
 * - Regular sales: A{sequence}{month}{year} (e.g., A010225)
 * - Batteries: B{sequence}{month}{year} (e.g., B010225)
 * - On Hold: OH{sequence}{month}{year} (e.g., OH010225)
 * - Credit: CR{sequence}{month}{year} (e.g., CR010225)
 */

import { getDatabase } from "@/lib/db/client";
import { billSequences } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export type TransactionType = 'SALE' | 'BATTERY' | 'ON_HOLD' | 'CREDIT';

export interface BillNumberConfig {
  locationId: string;
  transactionType: TransactionType;
}

/**
 * Generate structured bill numbers based on transaction type, month, year, and location
 */
export class BillNumberService {
  private static instance: BillNumberService;
  private db = getDatabase();

  private constructor() {}

  public static getInstance(): BillNumberService {
    if (!BillNumberService.instance) {
      BillNumberService.instance = new BillNumberService();
    }
    return BillNumberService.instance;
  }

  /**
   * Generate the next bill number for a given transaction type and location
   */
  async generateBillNumber(config: BillNumberConfig): Promise<string> {
    const { locationId, transactionType } = config;
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    const year = now.getFullYear();

    // Get or create sequence record
    const sequenceRecord = await this.getOrCreateSequenceRecord({
      locationId,
      transactionType,
      month,
      year
    });

    // Increment the sequence
    const nextSequence = sequenceRecord.currentSequence + 1;

    // Update the sequence in database
    await this.db
      .update(billSequences)
      .set({
        currentSequence: nextSequence,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(billSequences.id, sequenceRecord.id));

    // Generate the bill number
    return this.formatBillNumber(transactionType, nextSequence, month, year);
  }

  /**
   * Get the current sequence number for a given configuration
   */
  async getCurrentSequence(config: BillNumberConfig): Promise<number> {
    const { locationId, transactionType } = config;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const sequenceRecord = await this.getSequenceRecord({
      locationId,
      transactionType,
      month,
      year
    });

    return sequenceRecord?.currentSequence || 0;
  }

  /**
   * Get or create a sequence record for the given configuration
   */
  private async getOrCreateSequenceRecord(config: {
    locationId: string;
    transactionType: TransactionType;
    month: number;
    year: number;
  }): Promise<typeof billSequences.$inferSelect> {
    const { locationId, transactionType, month, year } = config;

    // Try to find existing record
    let [sequenceRecord] = await this.db
      .select()
      .from(billSequences)
      .where(
        and(
          eq(billSequences.transactionType, transactionType),
          eq(billSequences.month, month),
          eq(billSequences.year, year),
          eq(billSequences.locationId, locationId)
        )
      )
      .limit(1);

    // If no record exists, create one
    if (!sequenceRecord) {
      const [newRecord] = await this.db
        .insert(billSequences)
        .values({
          transactionType,
          month,
          year,
          currentSequence: 0,
          locationId,
        })
        .returning();

      sequenceRecord = newRecord;
    }

    return sequenceRecord;
  }

  /**
   * Get an existing sequence record (without creating if it doesn't exist)
   */
  private async getSequenceRecord(config: {
    locationId: string;
    transactionType: TransactionType;
    month: number;
    year: number;
  }): Promise<typeof billSequences.$inferSelect | null> {
    const { locationId, transactionType, month, year } = config;

    const [sequenceRecord] = await this.db
      .select()
      .from(billSequences)
      .where(
        and(
          eq(billSequences.transactionType, transactionType),
          eq(billSequences.month, month),
          eq(billSequences.year, year),
          eq(billSequences.locationId, locationId)
        )
      )
      .limit(1);

    return sequenceRecord || null;
  }

  /**
   * Format the bill number according to the specified structure
   */
  private formatBillNumber(
    transactionType: TransactionType,
    sequence: number,
    month: number,
    year: number
  ): string {
    // Get the prefix based on transaction type
    const prefix = this.getTransactionPrefix(transactionType);

    // Format sequence as 3 digits with leading zeros
    const formattedSequence = sequence.toString().padStart(3, '0');

    // Format month as 2 digits
    const formattedMonth = month.toString().padStart(2, '0');

    // Get last 2 digits of year
    const formattedYear = (year % 100).toString().padStart(2, '0');

    return `${prefix}${formattedSequence}${formattedMonth}${formattedYear}`;
  }

  /**
   * Get the prefix for a transaction type
   */
  private getTransactionPrefix(transactionType: TransactionType): string {
    switch (transactionType) {
      case 'SALE':
        return 'A';
      case 'BATTERY':
        return 'B';
      case 'ON_HOLD':
        return 'OH';
      case 'CREDIT':
        return 'CR';
      default:
        return 'A';
    }
  }

  /**
   * Parse a bill number to extract its components
   */
  parseBillNumber(billNumber: string): {
    prefix: string;
    sequence: number;
    month: number;
    year: number;
    transactionType: TransactionType;
  } | null {
    // Regular expression to match the format: A/B/OH/CR + 3 digits + 2 digits + 2 digits
    const regex = /^([AB]|OH|CR)(\d{3})(\d{2})(\d{2})$/;
    const match = billNumber.match(regex);

    if (!match) {
      return null;
    }

    const [, prefix, sequenceStr, monthStr, yearStr] = match;
    const sequence = parseInt(sequenceStr, 10);
    const month = parseInt(monthStr, 10);
    const year = 2000 + parseInt(yearStr, 10); // Assuming 20xx years

    // Convert prefix to transaction type
    let transactionType: TransactionType;
    switch (prefix) {
      case 'A':
        transactionType = 'SALE';
        break;
      case 'B':
        transactionType = 'BATTERY';
        break;
      case 'OH':
        transactionType = 'ON_HOLD';
        break;
      case 'CR':
        transactionType = 'CREDIT';
        break;
      default:
        return null;
    }

    return {
      prefix,
      sequence,
      month,
      year,
      transactionType
    };
  }

  /**
   * Validate if a bill number follows the correct format
   */
  validateBillNumber(billNumber: string): boolean {
    return this.parseBillNumber(billNumber) !== null;
  }

  /**
   * Reset sequence for a specific month/year (for testing or manual correction)
   */
  async resetSequence(
    locationId: string,
    transactionType: TransactionType,
    month: number,
    year: number,
    newSequence: number = 0
  ): Promise<void> {
    await this.db
      .update(billSequences)
      .set({
        currentSequence: newSequence,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(
        and(
          eq(billSequences.transactionType, transactionType),
          eq(billSequences.month, month),
          eq(billSequences.year, year),
          eq(billSequences.locationId, locationId)
        )
      );
  }
}

// Export singleton instance
export const billNumberService = BillNumberService.getInstance();
