@inventory you see sometimes the prices of the oils are changed by the suppliers for newer orders. We calways charge the same from our customers tho. It just affects our profits, revenue etc. so i think we should add some sort of batch feature like in different batch with different cost price, something like that, but how do we go about it. no code.

Your approach to manage different cost prices across batches is a common challenge in inventory management. Here's how you could structure a batch tracking system for your oils without affecting customer pricing:
Batch Inventory System Concept
Core Structure
Batch-Level Tracking: Each inventory item would have multiple "batches" associated with it
FIFO Accounting: Always sell from oldest batch first (First In, First Out)
Weighted Average Option: For simplified accounting, could also use weighted average cost
Key Data Elements
Batch ID: Unique identifier for each batch
Purchase Date: When the batch was acquired
Cost Price: What you paid for this specific batch
Quantity: How many units in this batch
Supplier: Who provided this batch
Expiration Date: When applicable for oils
Implementation Approach
The system would maintain your selling price separately from the variable cost prices. When inventory reports are generated, profit calculations would be batch-aware.
Batch Movement Logic
When receiving new inventory:
Create a new batch record
Assign the specific cost price
Update total available quantity
When selling products:
Deduct from oldest batch first
When a batch is depleted, move to next oldest
Calculate profit based on the specific batch cost price
Reporting Benefits
Profit Margin Analysis: See how margin changes across batches
Supplier Price Tracking: Monitor cost trends from suppliers
Inventory Valuation: More accurate financial statements
Forecasting: Better predict future profitability
This approach doesn't require changing your POS system's customer-facing pricing but gives you much more visibility into your actual costs and margins over time.
