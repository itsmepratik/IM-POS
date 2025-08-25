import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductModal } from "../components/product-modal";

// Sample data for demonstration
const oilData = {
  name: "Toyota",
  type: "0W-20",
  variants: [
    { id: 1, name: "5L", price: 39.99 },
    { id: 2, name: "4L", price: 34.99 },
    { id: 3, name: "1L", price: 11.99 },
    { id: 4, name: "500ml", price: 6.99 },
    { id: 5, name: "250ml", price: 3.99 },
  ],
};

const filterData = {
  name: "Toyota",
  type: "Oil Filter",
  variants: [
    { id: 1, name: "Oil Filter - Standard", price: 12.99 },
    { id: 2, name: "Oil Filter - Premium", price: 19.99 },
  ],
};

export default function ProductModalExample() {
  const [isOilModalOpen, setIsOilModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  const handleAddToCart = (selectedVariants: any[]) => {
    // In a real implementation, you would add these to your cart state
    console.log("Adding to cart:", selectedVariants);

    // For this example, we'll just append to our cartItems array
    setCartItems((prev) => [
      ...prev,
      ...selectedVariants.map((variant) => ({
        id: `${Date.now()}-${variant.id}`,
        productName: isOilModalOpen ? oilData.name : filterData.name,
        productType: isOilModalOpen ? oilData.type : filterData.type,
        variantName: variant.name,
        price: variant.price,
        quantity: variant.quantity,
        isOpenBottle: variant.isOpenBottle,
      })),
    ]);
  };

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-8">
        <Button onClick={() => setIsOilModalOpen(true)}>
          Open Lubricants Product Modal
        </Button>

        <Button onClick={() => setIsFilterModalOpen(true)}>
          Open Filter Product Modal
        </Button>
      </div>

      {/* Display cart items */}
      {cartItems.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Cart Items:</h3>
          <div className="border rounded-md p-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between py-2 border-b last:border-b-0"
              >
                <div>
                  <div className="font-medium">
                    {item.productName} - {item.productType}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.variantName}
                    {item.isOpenBottle && " (Open Bottle)"}x {item.quantity}
                  </div>
                </div>
                <div className="font-medium">
                  OMR {(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Modals */}
      <ProductModal
        isOpen={isOilModalOpen}
        onOpenChange={setIsOilModalOpen}
        productName={oilData.name}
        productType={oilData.type}
        variants={oilData.variants}
        onAddToCart={handleAddToCart}
      />

      <ProductModal
        isOpen={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        productName={filterData.name}
        productType={filterData.type}
        variants={filterData.variants}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
