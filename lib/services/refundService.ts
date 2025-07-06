// Types
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  details?: string;
  uniqueId: string;
  bottleType?: "open" | "closed";
}

export interface Receipt {
  receiptNumber: string;
  date: string;
  time: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  customerName?: string;
  cashierId?: string;
  cashierName?: string;
}

// Mock data - would be replaced with API calls in production
const mockReceipts: Receipt[] = [
  {
    receiptNumber: "A1234",
    date: "01/05/2023",
    time: "14:30:45",
    paymentMethod: "Card",
    total: 129.99,
    items: [
      {
        id: 1028,
        name: "Premium Battery",
        price: 129.99,
        quantity: 1,
        uniqueId: "1028-battery",
      },
    ],
  },
  {
    receiptNumber: "A2345",
    date: "02/05/2023",
    time: "10:15:22",
    paymentMethod: "Cash",
    total: 69.99,
    items: [
      {
        id: 1029,
        name: "Economy Battery",
        price: 69.99,
        quantity: 1,
        uniqueId: "1029-battery",
      },
    ],
  },
  {
    receiptNumber: "A4567",
    date: "04/05/2023",
    time: "13:22:18",
    paymentMethod: "Cash",
    total: 99.99,
    items: [
      {
        id: 1031,
        name: "Premium Battery with Trade-in",
        price: 129.99,
        quantity: 1,
        uniqueId: "1031-battery",
      },
      {
        id: 1032,
        name: "Discount on old battery",
        price: -30.0,
        quantity: 1,
        uniqueId: "1032-discount",
      },
    ],
  },
  {
    receiptNumber: "B1234",
    date: "05/05/2023",
    time: "09:20:15",
    paymentMethod: "Card",
    total: 89.75,
    items: [
      {
        id: 2001,
        name: "Shell Helix Ultra 5W-30",
        price: 45.99,
        quantity: 1,
        uniqueId: "2001-oil",
        details: "Synthetic Engine Oil",
      },
      {
        id: 2002,
        name: "Toyota Oil Filter",
        price: 12.5,
        quantity: 1,
        uniqueId: "2002-filter",
      },
      {
        id: 2003,
        name: "Air Filter Premium",
        price: 18.99,
        quantity: 1,
        uniqueId: "2003-filter",
      },
      {
        id: 2004,
        name: "Oil Change Service",
        price: 12.27,
        quantity: 1,
        uniqueId: "2004-service",
      },
    ],
  },
];

// Main service object with methods for handling refunds
const RefundService = {
  /**
   * Get a receipt by its number
   * In a real app, this would make an API call to the backend
   */
  getReceipt: (receiptNumber: string): Receipt | null => {
    return (
      mockReceipts.find(
        (r) => r.receiptNumber.toLowerCase() === receiptNumber.toLowerCase()
      ) || null
    );
  },

  /**
   * Get all receipts (with optional filtering)
   * In a real app, this would make an API call to the backend
   */
  getReceipts: (filters?: {
    startDate?: Date;
    endDate?: Date;
    customerId?: string;
  }) => {
    // In a real app, this would apply the filters
    return mockReceipts;
  },

  /**
   * Validate a staff ID against the list of authorized staff members
   * In a real app, this would make an API call to the backend
   */
  validateStaffId: (
    staffId: string,
    staffMembers: Array<{ id: string; name: string }>
  ): { id: string; name: string } | null => {
    return staffMembers.find((c) => c.id === staffId) || null;
  },

  /**
   * Process a refund transaction
   * In a real app, this would make an API call to the backend
   */
  processRefund: async (
    receipt: Receipt,
    selectedItems: string[],
    cashierId: string,
    tradeInAmount: number
  ): Promise<{ success: boolean; refundId: string }> => {
    // This would call an API to process the refund in a real application

    // Simulate API call with a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a random refund ID with R prefix
        const refundId = `R${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`;

        resolve({ success: true, refundId });
      }, 500); // Simulate 500ms API call
    });
  },

  /**
   * Check if an array of items contains only batteries
   */
  containsOnlyBatteries: (items: CartItem[]): boolean => {
    if (!items || items.length === 0) return false;
    return items.every(
      (item) =>
        item.name.toLowerCase().includes("battery") ||
        (item.uniqueId && item.uniqueId.includes("battery"))
    );
  },

  /**
   * Calculate the total refund amount for selected items
   */
  calculateRefundAmount: (
    receipt: Receipt | null,
    selectedItems: string[]
  ): number => {
    if (!receipt) return 0;
    return receipt.items
      .filter((item) => selectedItems.includes(item.uniqueId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  /**
   * Calculate the trade-in amount for old batteries or other items
   */
  calculateTradeInAmount: (
    receipt: Receipt | null,
    selectedItems: string[]
  ): number => {
    if (!receipt || selectedItems.length === 0) return 0;

    const tradeInItems = receipt.items.filter(
      (item) =>
        selectedItems.includes(item.uniqueId) &&
        item.name.toLowerCase().includes("discount on old battery")
    );

    if (tradeInItems.length > 0) {
      return tradeInItems.reduce(
        (sum, item) => sum + Math.abs(item.price * item.quantity),
        0
      );
    }

    return 0;
  },

  /**
   * Process a warranty claim
   * In a real app, this would make an API call to the backend
   */
  processWarrantyClaim: async (
    receipt: Receipt,
    selectedItems: string[],
    cashierId: string
  ): Promise<{ success: boolean; claimId: string }> => {
    // Simulate API call with a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a random warranty claim ID with W prefix
        const claimId = `W${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`;

        resolve({ success: true, claimId });
      }, 500); // Simulate 500ms API call
    });
  },
};

export default RefundService;
