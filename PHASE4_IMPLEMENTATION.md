# Phase 4: Checkout & FIFO Transaction Logic Implementation

## Overview

This implementation provides a complete checkout system with First-In, First-Out (FIFO) inventory management, trade-in handling, and receipt generation for a POS system.

## Features Implemented

### ✅ Database Schema Updates

- **Enhanced `transactions` table** with additional fields:

  - `shopId`: Optional shop identifier
  - `cashierId`: Cashier who processed the transaction
  - `paymentMethod`: Payment method used
  - `receiptHtml`: Thermal receipt HTML
  - `batteryBillHtml`: A5 battery bill HTML

- **New `trade_in_transactions` table** for tracking trade-ins:
  - Links to main transaction
  - Tracks trade-in product, quantity, and value
  - Timestamps for audit trail

### ✅ Checkout API Endpoint (`/api/checkout`)

**Endpoint**: `POST /api/checkout`

**Input Schema**:

```typescript
{
  locationId: string (UUID),
  shopId?: string (UUID),
  paymentMethod: string,
  cashierId?: string (UUID),
  cart: Array<{
    productId: string (UUID),
    quantity: number,
    sellingPrice: number,
    volumeDescription?: string
  }>,
  tradeIns?: Array<{
    productId: string (UUID),
    quantity: number,
    tradeInValue: number
  }>
}
```

**Key Features**:

1. **Atomic Transactions**: All operations wrapped in database transaction
2. **FIFO Inventory Management**: Automatically processes oldest batches first
3. **Trade-in Handling**: Supports trade-ins with automatic stock updates
4. **Receipt Generation**: Creates thermal receipts or A5 battery bills
5. **Comprehensive Validation**: Input validation with Zod schemas
6. **Error Handling**: Detailed error messages and rollback on failure

### ✅ FIFO Logic Implementation

The system implements proper FIFO (First-In, First-Out) inventory management:

1. **Active Batch Selection**: Finds the active batch (`is_active_batch: true`) for each inventory item, ordered by purchase date (oldest first)
2. **Stock Deduction**: Decrements stock from the active batch only
3. **FIFO Rule**: When the active batch is depleted, deactivates it and activates the next oldest batch with stock
4. **Inventory Updates**: Updates main inventory counts based on product type (lubricants vs. standard products)

### ✅ Trade-in Processing

- **Trade-in Records**: Creates separate records in `trade_in_transactions` table
- **Stock Updates**: Automatically increments stock for trade-in products
- **Discount Application**: Applies trade-in value as discount to total amount
- **Audit Trail**: Maintains complete transaction history

### ✅ Receipt Generation

**Two Receipt Types**:

1. **Thermal Receipt** (for non-battery transactions):

   - Compact format for thermal printers
   - Includes itemized list, totals, and payment method
   - Professional styling with proper formatting

2. **A5 Battery Bill** (for battery transactions):
   - Larger format for battery sales
   - Includes warranty information
   - Enhanced styling with warranty details

### ✅ Utility Functions

**Type Definitions** (`lib/types/checkout.ts`):

- Comprehensive Zod schemas for validation
- TypeScript type exports
- Utility functions for calculations

**Receipt Utilities** (`lib/utils/receipts.ts`):

- Receipt generation functions
- Currency and date formatting
- Responsive HTML templates

## API Usage Examples

### Basic Checkout

```javascript
const response = await fetch("/api/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    locationId: "location-uuid",
    paymentMethod: "CASH",
    cashierId: "cashier-uuid",
    cart: [
      {
        productId: "product-uuid",
        quantity: 2,
        sellingPrice: 15.5,
      },
    ],
  }),
});
```

### Checkout with Trade-ins

```javascript
const response = await fetch("/api/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    locationId: "location-uuid",
    paymentMethod: "CARD",
    cashierId: "cashier-uuid",
    cart: [
      {
        productId: "battery-uuid",
        quantity: 1,
        sellingPrice: 120.0,
        volumeDescription: "100AH",
      },
    ],
    tradeIns: [
      {
        productId: "scrap-battery-uuid",
        quantity: 1,
        tradeInValue: 25.0,
      },
    ],
  }),
});
```

## Response Format

```typescript
{
  success: boolean,
  data?: {
    transaction: {
      id: string,
      referenceNumber: string,
      locationId: string,
      totalAmount: string,
      // ... other transaction fields
    },
    receiptHtml?: string,
    batteryBillHtml?: string,
    isBattery: boolean
  },
  error?: string,
  details?: any[]
}
```

## Error Handling

The API provides comprehensive error handling:

- **Validation Errors**: Detailed Zod validation error messages
- **Business Logic Errors**: Clear messages for insufficient stock, missing inventory, etc.
- **Database Errors**: Proper transaction rollback on failures
- **HTTP Status Codes**: Appropriate status codes (400 for validation, 500 for server errors)

## Testing

### Test Endpoint

Use `/api/checkout/test` to get sample data and test payloads:

```javascript
const testData = await fetch("/api/checkout/test").then((r) => r.json());
console.log(testData.testData.sampleCheckoutPayload);
```

### Database Requirements

Before testing, ensure you have:

1. At least one location in the `locations` table
2. At least one product in the `products` table
3. Inventory records linking products to locations
4. Batch records with stock for testing FIFO logic

## Migration

Run the database migration to apply schema changes:

```bash
bun run drizzle-kit generate
bun run drizzle-kit migrate
```

## Security Considerations

- **Input Validation**: All inputs validated with Zod schemas
- **SQL Injection Prevention**: Uses Drizzle ORM with parameterized queries
- **Transaction Safety**: Atomic operations with automatic rollback
- **Error Information**: Sanitized error messages to prevent information leakage

## Performance Considerations

- **Batch Processing**: Efficient FIFO processing across multiple batches
- **Database Transactions**: Single transaction for all operations
- **Receipt Caching**: Receipt HTML stored in database for quick retrieval
- **Indexed Queries**: Proper database indexes for inventory and batch lookups

## Future Enhancements

Potential improvements for future phases:

1. **Receipt Templates**: Configurable receipt templates
2. **Payment Integration**: Integration with payment gateways
3. **Inventory Alerts**: Low stock notifications
4. **Analytics**: Transaction analytics and reporting
5. **Multi-location**: Cross-location inventory transfers
