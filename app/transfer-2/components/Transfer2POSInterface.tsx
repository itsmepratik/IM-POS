"use client";

import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Package,
  Minus,
  Plus,
  ShoppingCart,
  X,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  Droplet,
  Settings,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useIntegratedPOSData } from "@/lib/hooks/data/useIntegratedPOSData";
import { ProductImage } from "./ProductImage";

// Interface for POS items that will be selected
interface POSCartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  details?: string;
  uniqueId: string;
  bottleType?: "open" | "closed";
}

interface Transfer2POSInterfaceProps {
  onCartUpdate: (cart: POSCartItem[]) => void;
  initialCart?: POSCartItem[];
}

// Memoized Cart Item Component
const CartItem = memo(
  ({
    item,
    updateQuantity,
    removeFromCart,
  }: {
    item: POSCartItem;
    updateQuantity: (id: number, quantity: number, uniqueId?: string) => void;
    removeFromCart: (id: number, uniqueId?: string) => void;
  }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="font-medium text-sm">{item.name}</div>
        {item.details && (
          <div className="text-xs text-muted-foreground">{item.details}</div>
        )}
        <div className="text-sm font-medium text-primary">
          OMR {item.price.toFixed(3)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() =>
              updateQuantity(item.id, item.quantity - 1, item.uniqueId)
            }
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="px-2 text-sm font-medium w-8 text-center">
            {item.quantity}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() =>
              updateQuantity(item.id, item.quantity + 1, item.uniqueId)
            }
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          onClick={() => removeFromCart(item.id, item.uniqueId)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
);
CartItem.displayName = "CartItem";

export function Transfer2POSInterface({
  onCartUpdate,
  initialCart = [],
}: Transfer2POSInterfaceProps) {
  const { toast } = useToast();
  const [cart, setCart] = useState<POSCartItem[]>(initialCart);
  const [activeCategory, setActiveCategory] = useState<string>("Lubricants");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  // Get real POS data
  const { lubricantProducts, products } = useIntegratedPOSData();

  // Categories available - all 4 categories like original POS
  const categories = ["Lubricants", "Filters", "Parts", "Additives & Fluids"];

  // Update parent component when cart changes
  useEffect(() => {
    onCartUpdate(cart);
  }, [cart, onCartUpdate]);

  // Get unique brands for the active category
  const getBrandsForCategory = useMemo(() => {
    if (activeCategory === "Lubricants") {
      return Array.from(new Set(lubricantProducts.map((p) => p.brand)));
    } else {
      return Array.from(
        new Set(
          products
            .filter((p) => p.category === activeCategory)
            .map((p) => p.brand || "Other")
        )
      );
    }
  }, [activeCategory, lubricantProducts, products]);

  // Add to cart function
  const addToCart = useCallback(
    (product: any, details?: string, quantity: number = 1) => {
      const uniqueId = `${product.id}-${details || "default"}`;
      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (item) => item.uniqueId === uniqueId
        );
        if (existingItem) {
          return prevCart.map((item) =>
            item.uniqueId === uniqueId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }

        const fullName = product.brand
          ? `${product.brand} ${product.name}`
          : product.name;

        return [
          ...prevCart,
          {
            id: product.id,
            name: fullName,
            price: product.price || product.basePrice,
            quantity,
            details,
            uniqueId,
          },
        ];
      });

      toast({
        title: "Item Added",
        description: `${product.name} added to transfer bill`,
      });
    },
    [toast]
  );

  // Update quantity function
  const updateQuantity = useCallback(
    (productId: number, newQuantity: number, uniqueId?: string) => {
      if (newQuantity < 1) {
        removeFromCart(productId, uniqueId);
      } else {
        setCart((prevCart) =>
          prevCart.map((item) =>
            uniqueId
              ? item.uniqueId === uniqueId
                ? { ...item, quantity: newQuantity }
                : item
              : item.id === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      }
    },
    []
  );

  // Remove from cart function
  const removeFromCart = useCallback((productId: number, uniqueId?: string) => {
    setCart((prevCart) => {
      return prevCart.filter((item) =>
        uniqueId ? item.uniqueId !== uniqueId : item.id !== productId
      );
    });
  }, []);

  // Clear cart function
  const clearCart = useCallback(() => {
    setCart([]);
    toast({
      title: "Cart Cleared",
      description: "All items removed from transfer bill",
    });
  }, [toast]);

  // Handle lubricant selection (with volume options)
  const handleLubricantSelect = useCallback(
    (lubricant: any) => {
      if (lubricant.volumes && lubricant.volumes.length > 1) {
        // Add the base volume (first option) - in real implementation show volume modal
        const baseVolume = lubricant.volumes[0];
        addToCart(
          { ...lubricant, price: baseVolume.price },
          `${baseVolume.size}`,
          1
        );
      } else {
        addToCart({
          ...lubricant,
          price: lubricant.basePrice || lubricant.price,
        });
      }
    },
    [addToCart]
  );

  // Filter products/brands based on search
  const filteredBrands = useMemo(() => {
    return getBrandsForCategory.filter((brand) =>
      brand.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [getBrandsForCategory, searchQuery]);

  // Get products for a specific brand
  const getProductsForBrand = useCallback(
    (brand: string) => {
      if (activeCategory === "Lubricants") {
        return lubricantProducts.filter((p) => p.brand === brand);
      } else {
        return products.filter(
          (p) =>
            p.category === activeCategory &&
            (p.brand || "Other") === brand &&
            (searchQuery === "" ||
              p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
    },
    [activeCategory, lubricantProducts, products, searchQuery]
  );

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Lubricants":
        return <Droplet className="h-4 w-4" />;
      case "Filters":
        return <Settings className="h-4 w-4" />;
      case "Parts":
        return <Wrench className="h-4 w-4" />;
      case "Additives & Fluids":
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-[600px] flex flex-col lg:flex-row gap-4">
      {/* Left Panel - Products */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Search and Category Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveCategory(category);
                  setExpandedBrand(null); // Reset expanded brand when switching categories
                }}
                className="flex items-center gap-2 justify-start"
              >
                {getCategoryIcon(category)}
                <span className="hidden sm:inline truncate">{category}</span>
                <span className="sm:hidden text-xs">
                  {category.split(" ")[0]}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Products by Brand */}
        <ScrollArea className="h-[450px] lg:h-[480px]">
          <div className="space-y-4 p-1">
            {filteredBrands.map((brand) => {
              const brandProducts = getProductsForBrand(brand);
              if (brandProducts.length === 0) return null;

              const isExpanded = expandedBrand === brand;

              return (
                <div key={brand} className="border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-4 h-auto"
                    onClick={() => setExpandedBrand(isExpanded ? null : brand)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-sm text-primary">
                          {brand.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium">{brand}</h3>
                        <p className="text-sm text-muted-foreground">
                          {brandProducts.length} product
                          {brandProducts.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>

                  {isExpanded && (
                    <div className="p-4 pt-0">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {brandProducts.map((product) => (
                          <Button
                            key={product.id}
                            variant="outline"
                            className="h-auto min-h-[140px] flex flex-col items-center justify-between p-4 hover:shadow-lg hover:border-primary/50 transition-all duration-200 overflow-hidden border-2"
                            onClick={() => {
                              if (activeCategory === "Lubricants") {
                                handleLubricantSelect(product);
                              } else {
                                addToCart(product);
                              }
                            }}
                          >
                            <div className="mb-3 flex justify-center">
                              <ProductImage
                                product={{
                                  id: product.id,
                                  name: product.name,
                                  brand: product.brand,
                                  category: activeCategory,
                                  ...(product as any), // Spread all other properties including image fields
                                }}
                                size="lg"
                                className="shadow-sm ring-1 ring-border/50"
                              />
                            </div>
                            <div className="text-center flex-1 flex flex-col justify-between min-h-0 gap-2">
                              <span className="text-sm font-semibold line-clamp-2 leading-tight text-foreground">
                                {product.name}
                              </span>
                              <span className="text-base text-primary font-bold">
                                OMR{" "}
                                {(
                                  product.basePrice ||
                                  product.price ||
                                  0
                                ).toFixed(3)}
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredBrands.length === 0 && (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No products found</p>
                  {searchQuery && (
                    <p className="text-xs">Try searching for something else</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Cart */}
      <Card className="w-full lg:w-80 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Transfer Bill
            </span>
            <Badge variant="secondary">{cart.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div>
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No items selected</p>
                <p className="text-xs">Add products to create transfer bill</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6 max-h-60 lg:max-h-80">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <CartItem
                      key={item.uniqueId}
                      item={item}
                      updateQuantity={updateQuantity}
                      removeFromCart={removeFromCart}
                    />
                  ))}
                </div>
              </ScrollArea>
              <Separator className="my-3" />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="text-lg font-bold text-primary">
                    OMR {cartTotal.toFixed(3)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {cart.length} item{cart.length !== 1 ? "s" : ""} • Total: OMR{" "}
                  {cartTotal.toFixed(3)}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
