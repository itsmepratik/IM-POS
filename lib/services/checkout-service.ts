/**
 * Enhanced Checkout Service
 *
 * Provides robust checkout processing with:
 * - Exponential backoff retry mechanisms
 * - Circuit breaker pattern for API failures
 * - Offline transaction storage
 * - Connection optimization
 * - Graceful error handling
 */

import { toast } from "@/hooks/use-toast";

// Types for checkout data
export interface CheckoutItem {
  productId: string;
  quantity: number;
  sellingPrice: number;
  volumeDescription?: string;
  source?: "OPEN" | "CLOSED";
}

export interface CheckoutTradeIn {
  productId: string;
  quantity: number;
  tradeInValue: number;
  size?: string;
  condition?: string;
  name?: string; // Battery size as name for battery trade-ins
  costPrice?: number; // Trade-in amount as cost price for battery trade-ins
}

export interface CheckoutRequest {
  locationId: string;
  shopId: string;
  paymentMethod: string;
  cashierId: string;
  cart: CheckoutItem[];
  tradeIns?: CheckoutTradeIn[];
  carPlateNumber?: string; // For 'on hold' payments
  customerId?: string; // Optional customer ID for linking transactions to customers
}

export interface CheckoutResponse {
  success: boolean;
  data?: {
    transaction: any;
    receiptHtml?: string;
    batteryBillHtml?: string;
    isBattery?: boolean;
  };
  error?: string;
  details?: any;
}

// Circuit breaker states
enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // API is failing, bypass temporarily
  HALF_OPEN = "HALF_OPEN", // Testing if API has recovered
}

// Configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay
const CIRCUIT_FAILURE_THRESHOLD = 5; // Number of failures before opening circuit
const CIRCUIT_RECOVERY_TIMEOUT = 30000; // 30 seconds before trying API again
const REQUEST_TIMEOUT = 15000; // 15 second timeout for API calls

class CheckoutService {
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private pendingTransactions: CheckoutRequest[] = [];

  /**
   * Process checkout with comprehensive error handling and retry logic
   */
  async processCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    // Check circuit breaker state – if the circuit is OPEN we fail fast to
    // ensure the caller is aware that online checkout is currently
    // unavailable.  We no longer support any form of offline checkout or
    // local transaction storage.
    if (this.shouldBypassAPI()) {
      return {
        success: false,
        error:
          "Checkout service is temporarily unavailable. Please try again in a few moments.",
      };
    }

    // Attempt API checkout with retry logic
    try {
      const response = await this.attemptAPICheckout(request);
      this.onAPISuccess();
      return response;
    } catch (error) {
      console.error("API checkout failed:", error);
      this.onAPIFailure();

      // We deliberately avoid any offline fallback.  Propagate a clear error
      // so that the UI can instruct the user to retry once connectivity is
      // restored.
      return {
        success: false,
        error: (error as Error)?.message || "Unknown checkout error",
        details: error,
      };
    }
  }

  /**
   * Attempt API checkout with exponential backoff retry
   */
  private async attemptAPICheckout(
    request: CheckoutRequest,
    attempt: number = 1
  ): Promise<CheckoutResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Attempt": attempt.toString(),
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific HTTP errors with better error messages
        if (response.status === 503) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              "Database service is temporarily unavailable. Please try again in a moment."
          );
        } else if (response.status >= 500) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Server error (${response.status}). Please check your database connection and try again.`
          );
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              "Invalid request data. Please check your input and try again."
          );
        } else if (response.status === 404) {
          throw new Error(
            "Checkout endpoint not found. Please check your API configuration."
          );
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Checkout processing failed");
      }

      return result;
    } catch (error) {
      // Retry logic with exponential backoff
      if (attempt < RETRY_ATTEMPTS && this.isRetryableError(error)) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(
          `Retrying checkout in ${delay}ms (attempt ${attempt}/${RETRY_ATTEMPTS})`
        );

        await this.delay(delay);
        return this.attemptAPICheckout(request, attempt + 1);
      }

      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Offline checkout & synchronisation functionality has been permanently
  // removed as per security/performance guidelines.  The following legacy
  // methods remain only for reference and will throw if called.
  // ---------------------------------------------------------------------------

  private async processOfflineCheckout(): Promise<CheckoutResponse> {
    throw new Error("Offline checkout is no longer supported.");
  }

  private storeOfflineTransaction(): void {
    /* no-op */
  }

  private generateOfflineReceipt() {
    throw new Error("Offline checkout is no longer supported.");
  }

  /**
   * Synchronize offline transactions when connection is restored
   */
  async syncOfflineTransactions(): Promise<void> {
    // No longer applicable – kept for backward compatibility (noop)
    return;
  }

  /**
   * Circuit breaker logic
   */
  private shouldBypassAPI(): boolean {
    if (this.circuitState === CircuitState.OPEN) {
      // Check if enough time has passed to try API again
      if (Date.now() - this.lastFailureTime > CIRCUIT_RECOVERY_TIMEOUT) {
        this.circuitState = CircuitState.HALF_OPEN;
        console.log("🔄 Circuit breaker: Half-open, testing API...");
        return false;
      }
      return true;
    }
    return false;
  }

  private onAPISuccess(): void {
    this.failureCount = 0;
    if (this.circuitState !== CircuitState.CLOSED) {
      this.circuitState = CircuitState.CLOSED;
      console.log("✅ Circuit breaker: Closed, API recovered");
    }
  }

  private onAPIFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= CIRCUIT_FAILURE_THRESHOLD) {
      this.circuitState = CircuitState.OPEN;
      console.log(
        `🚫 Circuit breaker: Opened after ${this.failureCount} failures`
      );
    }
  }

  /**
   * Utility methods
   */
  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      "Service temporarily unavailable",
      "Server error occurred",
      "Database connection failed",
      "timeout",
      "network",
      "ECONNRESET",
      "ENOTFOUND",
    ];

    const errorMessage = error?.message?.toLowerCase() || "";
    return retryableErrors.some((retryable) =>
      errorMessage.includes(retryable.toLowerCase())
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getOfflineTransactions(): any[] {
    return [];
  }

  private generateOfflineReferenceNumber(): string {
    return `OFF${Date.now().toString().slice(-6)}${Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, "0")}`;
  }

  private calculateTotalAmount(request: CheckoutRequest): number {
    const cartTotal = request.cart.reduce(
      (total, item) => total + item.sellingPrice * item.quantity,
      0
    );

    const tradeInTotal =
      request.tradeIns?.reduce(
        (total, tradeIn) => total - tradeIn.tradeInValue,
        0
      ) || 0;

    return Math.max(0, cartTotal + tradeInTotal);
  }

  private containsBatteryItems(cart: CheckoutItem[]): boolean {
    return cart.some(
      (item) =>
        item.volumeDescription?.toLowerCase().includes("battery") ||
        item.productId.includes("battery")
    );
  }

  private generateBasicReceiptHTML(data: {
    referenceNumber: string;
    totalAmount: number;
    items: CheckoutItem[];
    paymentMethod: string;
    isOffline: boolean;
  }): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB");
    const timeStr = now.toLocaleTimeString("en-GB");

    return `
      <div class="receipt-container" style="font-family: monospace; max-width: 400px; margin: 0 auto; padding: 20px;">
        <div class="header" style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">AL-TARATH NATIONAL CO.</h2>
          <p style="margin: 5px 0;">شركة الطارث الوطنية</p>
          ${
            data.isOffline
              ? '<p style="color: orange; font-weight: bold;">OFFLINE TRANSACTION</p>'
              : ""
          }
        </div>
        
        <div class="transaction-details" style="margin-bottom: 15px;">
          <p>Receipt: ${data.referenceNumber}</p>
          <p>Date: ${dateStr} ${timeStr}</p>
          <p>Payment: ${data.paymentMethod.toUpperCase()}</p>
        </div>
        
        <div class="items" style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 10px;">
          ${data.items
            .map(
              (item) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>${
                item.volumeDescription || `Product ${item.productId}`
              }</span>
              <span>${item.quantity} x ${item.sellingPrice.toFixed(3)} = ${(
                item.quantity * item.sellingPrice
              ).toFixed(3)}</span>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div class="total" style="border-top: 1px solid #000; padding-top: 10px; text-align: right;">
          <strong>TOTAL: OMR ${data.totalAmount.toFixed(3)}</strong>
        </div>
        
        <div class="footer" style="text-align: center; margin-top: 20px; font-size: 12px;">
          <p>Thank you for your business!</p>
          <p>شكراً لتسوقكم معنا</p>
          ${
            data.isOffline
              ? '<p style="color: orange;">* Transaction will sync when online</p>'
              : ""
          }
        </div>
      </div>
    `;
  }

  /**
   * Get offline transaction count
   */
  getOfflineTransactionCount(): number {
    return 0;
  }

  /**
   * Clear all offline transactions (use with caution)
   */
  clearOfflineTransactions(): void {
    /* no-op */
  }

  /**
   * Get circuit breaker status for debugging
   */
  getCircuitStatus() {
    return {
      state: this.circuitState,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      offlineTransactions: this.getOfflineTransactionCount(),
    };
  }
}

// Singleton instance
export const checkoutService = new CheckoutService();
