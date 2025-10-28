# Settlement Workflow - Visual Guide

## Overview

This document provides a visual guide to the settlement functionality, showing how ON_HOLD and CREDIT transactions are converted to paid transactions.

## Settlement Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    INITIAL TRANSACTION                          │
│                                                                 │
│  Customer makes purchase but doesn't pay immediately            │
│  ↓                                                              │
│  Cashier creates ON_HOLD or CREDIT transaction                 │
│  ↓                                                              │
│  Transaction saved with:                                        │
│    - Type: ON_HOLD or CREDIT                                   │
│    - Reference: SALE-1234567890                                │
│    - Status: Pending payment                                   │
│    - Color on UI: Yellow (ON_HOLD) or Orange (CREDIT)         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Customer returns to pay
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SETTLEMENT PROCESS                            │
│                                                                 │
│  STEP 1: Cashier opens POS → Disputes → Settlement             │
│  ↓                                                              │
│  STEP 2: Enter original transaction reference                  │
│    Input: SALE-1234567890                                      │
│    Validation: Check if transaction exists and is eligible     │
│  ↓                                                              │
│  STEP 3: Enter cashier ID for authentication                   │
│    Input: 0001                                                 │
│    Validation: Verify cashier exists and is active            │
│  ↓                                                              │
│  STEP 4: Review and confirm settlement details                 │
│    Display:                                                    │
│      - Original amount                                         │
│      - Customer info                                           │
│      - Cashier name                                            │
│  ↓                                                              │
│  STEP 5: Process settlement (API call)                         │
│    POST /api/settle-transaction                                │
│    {                                                           │
│      referenceNumber: "SALE-1234567890",                       │
│      cashierId: "0001",                                        │
│      paymentMethod: "CASH"                                     │
│    }                                                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Success
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SETTLEMENT CREATED                            │
│                                                                 │
│  New transaction record created:                               │
│    - Type: ON_HOLD_PAID or CREDIT_PAID                        │
│    - Reference: ON_HOLD_PAID-1234567890 (new)                 │
│    - Original Reference: SALE-1234567890 (link to original)   │
│    - Amount: Same as original                                  │
│    - Items: Same as original                                   │
│    - Payment Method: CASH (or selected method)                 │
│    - Cashier: Who processed the settlement                     │
│    - Timestamp: When settled                                   │
│  ↓                                                              │
│  UI Updates:                                                   │
│    - Success toast notification                                │
│    - Transaction page shows new green entry                    │
│    - Original transaction remains unchanged                    │
│    - Audit trail maintained                                    │
└─────────────────────────────────────────────────────────────────┘
```

## UI States

### 1. Settlement Modal - Reference Entry

```
┌──────────────────────────────────────┐
│          Settlement                  │
│  Convert a credited sale into a      │
│  regular sale                        │
│                                      │
│  Reference/Bill Number               │
│  ┌────────────────────────────────┐ │
│  │ SALE-1234567890                │ │
│  └────────────────────────────────┘ │
│                                      │
│  [Cancel]         [Continue]         │
└──────────────────────────────────────┘
```

### 2. Settlement Modal - Cashier ID Entry

```
┌──────────────────────────────────────┐
│       Enter Cashier ID               │
│  Please enter your cashier ID to     │
│  proceed with settlement.            │
│                                      │
│          ┌──────┐                    │
│          │ 0001 │                    │
│          └──────┘                    │
│                                      │
│        [Verify ID]                   │
│                                      │
│          [Back]                      │
└──────────────────────────────────────┘
```

### 3. Settlement Modal - Confirmation

```
┌──────────────────────────────────────┐
│      Confirm Settlement              │
│  Welcome, John Doe!                  │
│                                      │
│  Cashier ID: 0001                    │
│  Reference: SALE-1234567890          │
│                                      │
│  [Processing...]                     │
│  ═══════════════════════              │
│                                      │
│  [Back]    [Confirm Settlement]      │
└──────────────────────────────────────┘
```

## Transaction Display

### Before Settlement

```
┌────────────────────────────────────────────────────────┐
│ 🟡 On Hold               SALE-1234567890              │
│    10:30 AM                                           │
│    Cashier: John Doe                                  │
│    3 items                                OMR 25.500  │
│                                                        │
│    Car Plate: ABC-1234                                │
└────────────────────────────────────────────────────────┘
```

### After Settlement (New Transaction)

```
┌────────────────────────────────────────────────────────┐
│ 🟢 On-Hold Paid    ON_HOLD_PAID-1234567890           │
│    2:45 PM                                            │
│    Cashier: Jane Smith                                │
│    3 items                                OMR 25.500  │
│                                                        │
│    Settled from: SALE-1234567890                      │
└────────────────────────────────────────────────────────┘
```

### Original Transaction (Unchanged)

```
┌────────────────────────────────────────────────────────┐
│ 🟡 On Hold               SALE-1234567890              │
│    10:30 AM                                           │
│    Cashier: John Doe                                  │
│    3 items                                OMR 25.500  │
│                                                        │
│    Car Plate: ABC-1234                                │
└────────────────────────────────────────────────────────┘
```

## Color Coding

| Transaction Type | Color     | Hex Code  | Meaning                      |
| ---------------- | --------- | --------- | ---------------------------- |
| SALE             | 🟢 Green  | `#10b981` | Regular completed sale       |
| ON_HOLD_PAID     | 🟢 Green  | `#16a34a` | Settled on-hold transaction  |
| CREDIT_PAID      | 🟢 Green  | `#16a34a` | Settled credit transaction   |
| ON_HOLD          | 🟡 Yellow | `#eab308` | Awaiting payment             |
| CREDIT           | 🟠 Orange | `#f97316` | Credit sale awaiting payment |
| REFUND           | 🔴 Red    | `#ef4444` | Refunded transaction         |

## API Flow

```
┌──────────────┐
│   Frontend   │
│   POS Page   │
└──────┬───────┘
       │
       │ 1. User submits settlement
       │    POST /api/settle-transaction
       │    { referenceNumber, cashierId, paymentMethod }
       ↓
┌──────────────────────┐
│   API Endpoint       │
│   route.ts           │
│                      │
│   Validations:       │
│   ✓ Reference exists │
│   ✓ Type eligible    │
│   ✓ Not settled yet  │
│   ✓ Cashier valid    │
└──────┬───────────────┘
       │
       │ 2. Create settlement transaction
       │    INSERT INTO transactions
       ↓
┌──────────────────┐
│   Database       │
│   Supabase       │
│                  │
│   Tables:        │
│   • transactions │
│   • staff        │
│   • customers    │
└──────┬───────────┘
       │
       │ 3. Return success response
       ↓
┌──────────────┐
│   Frontend   │
│   Toast      │
│   Notification│
└──────────────┘
```

## Error Handling Flow

```
User Action → Validation → Result

Enter Reference
    ↓
    Is reference valid?
    ├─ No  → Show error: "Transaction not found"
    └─ Yes → Is type ON_HOLD or CREDIT?
              ├─ No  → Show error: "Only ON_HOLD and CREDIT can be settled"
              └─ Yes → Is already settled?
                        ├─ Yes → Show error: "Already settled"
                        └─ No  → Continue to cashier ID

Enter Cashier ID
    ↓
    Is cashier valid?
    ├─ No  → Show error: "Invalid cashier ID"
    └─ Yes → Continue to confirmation

Confirm Settlement
    ↓
    Process API call
    ├─ Network Error → Show error: "Network error, please retry"
    ├─ API Error     → Show error: API error message
    └─ Success       → Show success toast + update UI
```

## Database Structure

### Original Transaction

```sql
{
  id: uuid,
  reference_number: "SALE-1234567890",
  type: "ON_HOLD",
  total_amount: "25.500",
  items_sold: [...],
  payment_method: "ON_HOLD",
  car_plate_number: "ABC-1234",
  customer_id: uuid,
  cashier_id: "0001",
  created_at: "2025-10-28T10:30:00Z",
  original_reference_number: null
}
```

### Settlement Transaction

```sql
{
  id: uuid (new),
  reference_number: "ON_HOLD_PAID-1234567890",
  type: "ON_HOLD_PAID",
  total_amount: "25.500",
  items_sold: [...] (same as original),
  payment_method: "CASH",
  car_plate_number: "ABC-1234",
  customer_id: uuid (same as original),
  cashier_id: "0002" (who settled),
  created_at: "2025-10-28T14:45:00Z",
  original_reference_number: "SALE-1234567890" ← Links back
}
```

## Best Practices

### For Cashiers

1. ✅ Always verify customer identity before settling
2. ✅ Check the amount matches what customer is paying
3. ✅ Use correct payment method (cash, card, mobile)
4. ✅ Provide receipt after settlement

### For Managers

1. ✅ Monitor unsettled transactions regularly
2. ✅ Review settlement patterns for anomalies
3. ✅ Ensure cashiers are properly authenticated
4. ✅ Check audit trails for compliance

### For Developers

1. ✅ Always use the API endpoint (don't modify DB directly)
2. ✅ Test error scenarios thoroughly
3. ✅ Monitor API logs for issues
4. ✅ Keep audit trails intact

## Troubleshooting

### "Transaction not found"

- Check reference number is typed correctly
- Verify transaction exists in database
- Ensure you're in the correct branch/location

### "Already settled"

- Check transactions page for existing settlement
- Look for original_reference_number match
- May need to void and recreate if error

### "Invalid cashier ID"

- Verify cashier is active in system
- Check staff table for correct ID
- Ensure no typos in ID entry

### Settlement not appearing in transactions

- Refresh the transactions page
- Check date range filter
- Verify settlement was successful (check API logs)

---

**Pro Tip**: The settlement creates a NEW transaction record. The original ON_HOLD or CREDIT transaction remains unchanged for audit purposes. Both transactions will be visible in the transactions list, with the settlement showing the link back to the original via the "Settled from" note.
