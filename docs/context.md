## Overview

This document specifies the integration of a Point-of-Sale (POS) inventory system using Neon for the database backend. The system provides:

- Real-time inventory dashboard
- Enhanced controls for managers
- Automated stock alerts
- Financial reporting

## Database Plan: (very important)


# Updated Supabase Integration Plan for Automotive POS System

I've updated the plan to address the crucial oil inventory management requirements you mentioned. The system will now properly track partial oil usage from larger containers (4L/5L bottles), managing the "open bottle" state and deducting appropriately.

## 1. Database Schema Design (Updated with Oil Handling Focus)

### Core Tables (Updated)

1. **Products**
   - `id` (primary key)
   - `name`
   - `brand`
   - `category_id` (foreign key to Categories)
   - `base_price`
   - `product_type`
   - `created_at`
   - `is_oil` (boolean flag for quick filtering)
   - `image_url`

2. **Oil_Properties** (Expanded)
   - `id` (primary key)
   - `product_id` (foreign key to Products)
   - `viscosity` (e.g., "0W-20", "5W-30")
   - `is_synthetic` (boolean)
   - `oil_type` (e.g., engine, transmission, etc.)
   - `container_size` (either 4L or 5L as per your requirement)
   - `min_deduction_unit` (smallest amount that can be deducted, e.g., 0.25L)

3. **Oil_Inventory** (New specialized table)
   - `id` (primary key)
   - `branch_id` (foreign key to Branches)
   - `oil_product_id` (foreign key to Products)
   - `bottle_id` (unique identifier for tracking individual bottles)
   - `is_open` (boolean - tracks if bottle has been opened)
   - `remaining_volume` (decimal - starts at full size and decreases with usage)
   - `initial_volume` (either 4L or 5L depending on product)
   - `opened_date` (timestamp, null if unopened)
   - `is_empty` (boolean)
   - `last_used` (timestamp)

4. **Oil_Transactions** (New specialized table)
   - `id` (primary key)
   - `oil_inventory_id` (foreign key to Oil_Inventory)
   - `sale_id` (foreign key to Sales, nullable)
   - `volume_used` (decimal - amount deducted from bottle)
   - `timestamp`
   - `performed_by` (future user_id)

## 2. Oil Inventory Management Workflow (New)

### Oil Usage Process
1. When a customer requests an oil change requiring a partial amount (0.25L, 0.5L, 1L, 2L):
   - System first checks for already-open bottles of required oil type
   - If open bottle exists with sufficient remaining volume:
     - Deduct amount from open bottle
     - Record transaction in Oil_Transactions
     - Update remaining_volume in Oil_Inventory
     - If bottle becomes empty (remaining_volume = 0), mark as empty
   - If no open bottle with sufficient volume:
     - Find unopened bottle in inventory
     - Mark it as open (is_open = true, opened_date = current timestamp)
     - Deduct requested amount
     - Update remaining_volume

2. For inventory levels:
   - Total available oil = (Number of unopened bottles × initial_volume) + Sum of remaining_volume in open bottles
   - System prioritizes oldest opened bottles first (FIFO)

## 3. Database Functions and Triggers

```sql
-- Sample SQL function (conceptual, will be implemented later)
CREATE OR REPLACE FUNCTION use_oil_from_inventory(
  p_branch_id INT,
  p_oil_product_id INT,
  p_volume_needed DECIMAL,
  p_sale_id INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_oil_inventory_id INT;
  v_remaining_in_bottle DECIMAL;
  v_amount_to_use DECIMAL;
  v_bottle_found BOOLEAN := FALSE;
BEGIN
  -- First try to find an open bottle with enough oil
  SELECT id, remaining_volume INTO v_oil_inventory_id, v_remaining_in_bottle
  FROM oil_inventory
  WHERE branch_id = p_branch_id
    AND oil_product_id = p_oil_product_id
    AND is_open = TRUE
    AND is_empty = FALSE
    AND remaining_volume >= p_volume_needed
  ORDER BY opened_date ASC
  LIMIT 1;
  
  -- If found, use this bottle
  IF v_oil_inventory_id IS NOT NULL THEN
    -- Update bottle
    UPDATE oil_inventory
    SET remaining_volume = remaining_volume - p_volume_needed,
        last_used = NOW(),
        is_empty = CASE WHEN (remaining_volume - p_volume_needed) <= 0 THEN TRUE ELSE FALSE END
    WHERE id = v_oil_inventory_id;
    
    -- Record transaction
    INSERT INTO oil_transactions (oil_inventory_id, sale_id, volume_used, timestamp)
    VALUES (v_oil_inventory_id, p_sale_id, p_volume_needed, NOW());
    
    RETURN TRUE;
  END IF;
  
  -- Logic to open a new bottle if needed would go here
  -- ...
  
  RETURN v_bottle_found;
END;
$$ LANGUAGE plpgsql;
```

## 4. UI Integration for Oil Management

The POS interface will be enhanced to:

1. Display open bottles and their remaining volumes
2. Allow selection of specific oil products for service
3. Show warning when low on certain oil types
4. Provide a visual indicator of bottle status (unopened, open but not empty, empty)
5. When processing an oil change service:
   - Record the exact amount used
   - Automatically deduct from appropriate open bottle
   - Open new bottle when needed

## 5. Real-time Monitoring for Oil Inventory

1. Dashboard widget showing:
   - Total oil available by type
   - Number of open bottles
   - Consumption trends
   - Alerts when bottles are nearly empty

2. Reports for oil consumption including:
   - Usage by oil type/viscosity
   - Average consumption per service
   - Most used oil types

## 6. Implementation Considerations

1. **Data Integrity Constraints**
   - Enforce that remaining_volume cannot be negative
   - Ensure opened_date is set when is_open becomes true
   - Track which staff member opened bottles for accountability

2. **Transaction Safety**
   - Use database transactions to ensure that inventory updates and sale records are atomic
   - Implement optimistic locking for concurrent access to same oil bottle

3. **Rollbacks and Adjustments**
   - Allow for adjustment of remaining volume (in case of spills or measurement errors)
   - Provide audit log of all bottle openings and usage

4. **Migration Strategy**
   - Initial setup of oil inventory with all unopened bottles
   - Process for entering current open bottles with remaining volumes during system launch

## 7. Benefits of This Design

1. **Accurate Inventory**: Precise tracking of partial oil usage ensures inventory counts are always accurate
2. **Reduced Waste**: By tracking open bottles and using them first, the system minimizes waste
3. **Cost Control**: Better visibility into oil consumption helps control costs and identify unusual usage patterns
4. **Streamlined Operations**: Staff doesn't need to manually track which bottles are open
5. **Data-Driven Purchasing**: Consumption data helps optimize purchasing of different oil types

This specialized oil inventory management system integrates with the overall POS system while addressing the unique requirements of automotive service operations. The design accounts for the reality that oil is consumed in partial amounts from larger containers, with proper tracking of opened bottles until they're completely used.

```
