export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  details?: string;
  uniqueId: string;
  productId?: string;
  volumeDescription?: string;
}

export interface Receipt {
  receiptNumber: string;
  date: string;
  time: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
}

export interface RefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to fetch product names by IDs from Supabase directly
export const fetchProductNames = async (
  productIds: string[],
): Promise<Map<string, string>> => {
  if (productIds.length === 0) return new Map();

  try {
    // Import Supabase client dynamically
    const { createClient } = await import("@/supabase/client");
    const supabase = createClient();

    // Query products table directly for these specific IDs (UUIDs)
    const { data: productsData, error } = await supabase
      .from("products")
      .select("id, name, brand_id, brands(id, name)")
      .in("id", productIds);

    if (error) {
      console.error("❌ Error fetching product names:", error);
      return new Map();
    }

    // Create a map of product ID (UUID string) to product name
    const productNameMap = new Map<string, string>();
    productsData?.forEach((product: any) => {
      const brandName = product.brands?.name;
      const fullName = brandName
        ? `${brandName} ${product.name}`
        : product.name;
      productNameMap.set(product.id, fullName);
    });

    return productNameMap;
  } catch (error) {
    console.error("❌ Exception fetching product names:", error);
    return new Map();
  }
};

// Helper function to fetch product details with category and type for battery validation
export const fetchProductDetails = async (
  productIds: string[],
): Promise<
  Map<
    string,
    {
      categoryName: string | null;
      productType: string | null;
      typeName: string | null;
    }
  >
> => {
  if (productIds.length === 0) return new Map();

  try {
    // Import Supabase client dynamically
    const { createClient } = await import("@/supabase/client");
    const supabase = createClient();

    // Query products table with category and type information
    const { data: productsData, error } = await supabase
      .from("products")
      .select(
        `
        id,
        product_types(
          types(name)
        ),
        categories(name)
      `,
      )
      .in("id", productIds);

    if (error) {
      console.error("❌ Error fetching product details:", error);
      return new Map();
    }

    // Create a map of product ID to product details
    const productDetailsMap = new Map();
    productsData?.forEach((product: any) => {
      productDetailsMap.set(product.id, {
        categoryName: product.categories?.name || null,
        productType: product.product_types?.[0]?.types?.name || null,
        typeName: product.product_types?.[0]?.types?.name || null,
      });
    });

    return productDetailsMap;
  } catch (error) {
    console.error("❌ Exception fetching product details:", error);
    return new Map();
  }
};

export async function parseTransactionItems(items: any[]): Promise<CartItem[]> {
  // Extract product IDs that need name lookup
  const productIds = items
    .map((item: any) => {
      const id = item.productId || item.id || item.product_id;
      return id;
    })
    .filter((id: any) => {
      if (!id) {
        return false;
      }
      if (typeof id !== "string") {
        return false;
      }
      return true;
    });

  // Fetch product names for these IDs
  const productNameMap = await fetchProductNames(productIds);

  return items.map((item: any, index: number) => {
    // Handle both old format (name, price) and new format (productId, sellingPrice)
    const productId = item.productId || item.id || `${index}`;

    // For lubricant products, prefer volumeDescription as it contains the full product name with size
    // This is critical for matching during refunds
    const volumeDescription = item.volumeDescription || item.volume_description;
    const fetchedName = productNameMap.get(productId);

    // Priority: volumeDescription > name > productName > fetchedName
    // For lubricants, volumeDescription is usually "Product Name - Size" (e.g., "Shell 20W-50 - 1L")
    const itemName =
      volumeDescription || // CRITICAL: Use volumeDescription for lubricants (includes size)
      item.name ||
      item.productName ||
      item.product_name ||
      fetchedName || // Use fetched product name with brand
      `Product ${productId}`;

    const itemPrice = item.price || item.sellingPrice || 0;
    const itemQuantity = item.quantity || 1;
    const itemId = item.id || item.productId || index;

    // Preserve original productId for matching purposes
    const originalProductId = item.productId || item.product_id || item.id;

    return {
      id: typeof itemId === "string" ? parseInt(itemId) || index : itemId,
      name: itemName, // This will be volumeDescription for lubricants
      price: parseFloat(itemPrice.toString()),
      quantity: itemQuantity,
      uniqueId: `${itemId}-${Date.now()}-${index}`,
      details: item.details || volumeDescription || undefined,
      // Preserve original productId for refund matching
      productId: originalProductId,
      // CRITICAL: Preserve volumeDescription for lubricant matching
      volumeDescription: volumeDescription,
    };
  });
}
