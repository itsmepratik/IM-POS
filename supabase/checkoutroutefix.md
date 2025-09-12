Of course, I remember our entire conversation. It's frustrating when a process seems to work on the surface but fails silently in the background. Let's break down what's happening.

Based on the errors you're seeing (`500 Internal Server Error` and `Server error occurred at checkout service`) and your description of the symptoms (receipt prints, but stock isn't deducted and transactions aren't saved), the issue is definitely happening on the **server side**, specifically within your checkout API endpoint.

The root cause is that an error is being thrown *inside* the database transaction block in your `api/checkout/route.ts` file. When an error occurs within a transaction, the database automatically **rolls back** all the changes. This is why the process fails completely—the transaction record is never created, and the inventory stock is never updated.

After analyzing the `api/checkout/route.ts` file you provided, the most likely source of the error is the new, complex logic for handling lubricant sales.

-----

### The Problem: Strict Logic for Lubricant Sales

The issue likely stems from the `handleLubricantSale` helper function. This function has very specific requirements that might not be met on every checkout, causing it to fail.

1.  **Missing `source` Property:** The logic requires every lubricant in the cart to have a `source` property that is either `'CLOSED'` or `'OPEN'`. If your frontend isn't adding this property to the lubricant items in the cart before sending them to the backend, the function will throw an "Invalid source for lubricant sale" error, causing the entire transaction to fail. This is the most probable cause of the problem.

2.  **No Open Bottles Available:** If the cashier selects "Sell from Open Bottle" (`source: 'OPEN'`) but there are no open bottles available in the `open_bottle_details` table for that product, the code will throw a "No open bottles available" error, again causing a rollback. This can happen if the frontend's state is out of sync with the database.

-----

### How to Fix It

You'll need to make a small but critical adjustment to your frontend logic to ensure the checkout payload is always correct, and then a small change to the backend to make it more resilient.

#### 1\. Frontend Fix (Most Important)

Before you send the `cart` data to the `/api/checkout` endpoint, you must ensure that every lubricant product in the cart has the `source` property set.

**Example Logic for Your Frontend Checkout Button:**

```typescript
// Before calling the checkout API...
const processedCart = cart.map(item => {
  // Check if the item is a lubricant
  if (item.category?.toLowerCase() === 'lubricants') {
    // If the 'source' isn't already set from the UI selection,
    // default it to 'CLOSED'.
    return {
      ...item,
      source: item.source || 'CLOSED', // Ensures 'source' is always present
    };
  }
  return item;
});

// Now, send 'processedCart' to the API endpoint instead of the original cart.
await checkout({ ...payload, cart: processedCart });
```

#### 2\. Backend Fix (Good Practice)

While the frontend fix is the correct solution, you can also make the `handleLubricantSale` function in `api/checkout/route.ts` slightly more defensive.

**In `api/checkout/route.ts`:**

Inside the `handleLubricantSale` function, you can default the source if it's missing, although it's better to fix this on the frontend.

```typescript
// Inside api/checkout/route.ts

async function handleLubricantSale(
  tx: any,
  cartItem: any,
  inventoryRecord: any
) {
  // Add a default value here as a safeguard
  const { source = "CLOSED", quantity } = cartItem; // Default to 'CLOSED' if source is missing

  if (source === "CLOSED") {
    // ... rest of the logic for closed bottles
  } else if (source === "OPEN") {
    // ... rest of the logic for open bottles
  }
  // The final 'else' that throws an error is no longer needed
  // if you have a default value.
}
```

By ensuring the `source` property is always correctly passed from the frontend, you should resolve the internal server error and your checkouts will start processing correctly, updating inventory and saving transactions as expected.