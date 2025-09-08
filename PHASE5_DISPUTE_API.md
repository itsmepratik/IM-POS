# Phase 5: Dispute Logic Implementation

## Overview

This document describes the implementation of the dispute handling system that allows processing refunds and warranty claims using bill numbers.

## Features Implemented

### 1. Dispute API Endpoint (`/api/dispute`)

The dispute API handles both refunds and warranty claims with the following capabilities:

- **Input Validation**: Comprehensive Zod schema validation
- **Transaction Lookup**: Fetches original sale transactions by bill number
- **Conditional Inventory Updates**: Different logic for refunds vs warranty claims
- **Receipt Generation**: Supports both thermal and battery bill formats
- **Audit Trail**: Links dispute transactions to original sales

### 2. Type Safety

Created comprehensive TypeScript types and schemas:

- `DisputeInput`: Input validation schema
- `DisputedItem`: Individual item being disputed
- `DisputeResponse`: API response structure

### 3. Database Schema Integration

Leverages existing transaction table structure:

- `type`: Supports 'REFUND' and 'WARRANTY_CLAIM'
- `originalReferenceNumber`: Links disputes to original sales
- `receiptHtml` and `batteryBillHtml`: Stores generated receipts

## API Usage

### Endpoint: `POST /api/dispute`

#### Request Body:

```json
{
  "originalBillNumber": "TXN123456789",
  "disputeType": "REFUND", // or "WARRANTY_CLAIM"
  "locationId": "uuid",
  "shopId": "uuid",
  "cashierId": "uuid",
  "disputedItems": [
    {
      "productId": "uuid",
      "quantity": 2,
      "sellingPrice": 10.5,
      "volumeDescription": "500ml"
    }
  ]
}
```

#### Response:

```json
{
  "success": true,
  "data": {
    "disputeTransaction": {
      "id": "uuid",
      "referenceNumber": "REF12345678901",
      "originalReferenceNumber": "TXN123456789",
      "type": "REFUND",
      "totalAmount": "-21.000",
      "receiptHtml": "...",
      "batteryBillHtml": null
    },
    "originalTransaction": {
      /* original transaction data */
    },
    "isBattery": false
  },
  "message": "REFUND processed successfully. Reference: REF12345678901"
}
```

## Business Logic

### Refund Processing

1. **Validation**: Verifies original transaction exists and is a sale
2. **Transaction Creation**: Creates new transaction with negative total
3. **Inventory Updates**:
   - **Lubricants**: Increments `closed_bottles_stock`
   - **Standard Products**: Increments `standard_stock`
4. **Receipt Generation**: Creates appropriate receipt format

### Warranty Claim Processing

1. **Validation**: Same as refund processing
2. **Transaction Creation**: Creates new transaction (positive total for tracking)
3. **Inventory Updates**: **No changes** to inventory levels
4. **Receipt Generation**: Creates appropriate receipt format

## Reference Number Generation

- **Refunds**: `REF` prefix + timestamp + random number
- **Warranty Claims**: `WAR` prefix + timestamp + random number

## Error Handling

The API provides comprehensive error handling:

- **Input Validation**: Zod schema validation with detailed error messages
- **Transaction Not Found**: Clear error when original bill number doesn't exist
- **Product Validation**: Ensures all disputed products exist
- **Inventory Validation**: Checks inventory records exist for location
- **Database Errors**: Proper transaction rollback on failures

## Testing

A comprehensive test script is available at `scripts/test-dispute-api.ts` with:

- Sample test data for both refunds and warranty claims
- Instructions for customizing test data
- Expected behavior documentation
- Database verification steps

## File Structure

```
lib/types/dispute.ts          # Type definitions and validation schemas
app/api/dispute/route.ts      # Main API endpoint implementation
scripts/test-dispute-api.ts   # Testing utilities and examples
PHASE5_DISPUTE_API.md        # This documentation
```

## Integration Points

### With Existing Systems

- **Checkout API**: Uses same patterns for transaction handling
- **Inventory System**: Integrates with existing lubricant/standard stock logic
- **Receipt System**: Reuses thermal and battery bill generators
- **Database**: Uses existing transaction and inventory tables

### Security Considerations

- All inputs validated server-side
- Database operations wrapped in transactions
- No sensitive data exposed in responses
- Proper error handling prevents information leakage

## Next Steps

To complete the dispute system integration:

1. **Frontend Integration**: Create UI components for dispute processing
2. **Staff Permissions**: Add role-based access control
3. **Reporting**: Include disputes in sales reports
4. **Notifications**: Add alerts for dispute processing
5. **Audit Logs**: Enhanced logging for compliance

## Technical Notes

- Uses Drizzle ORM for type-safe database operations
- Follows Next.js 15 App Router patterns
- Implements proper TypeScript typing throughout
- Uses existing utility functions for consistency
- Maintains audit trail through linked transactions
