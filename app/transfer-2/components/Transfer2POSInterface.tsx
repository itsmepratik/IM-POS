"use client";

import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Package,
  Minus,
  Plus,
  ShoppingCart,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Droplet,
  Settings,
  Wrench,
  ImageIcon,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useIntegratedPOSData } from "@/lib/hooks/data/useIntegratedPOSData";
import { ProductImage } from "./ProductImage";
import { BrandLogo } from "@/app/pos/components/brand-logo";
import { OpenBottleIcon, ClosedBottleIcon } from "@/components/ui/bottle-icons";
import { cn } from "@/lib/utils";

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
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 group">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.name}</div>
        {item.details && (
          <div className="text-xs text-muted-foreground mt-0.5">{item.details}</div>
        )}
        {item.bottleType && (
          <div className="flex items-center gap-1 mt-1">
            {item.bottleType === "closed" ? (
              <ClosedBottleIcon className="h-3 w-3 text-primary" />
            ) : (
              <OpenBottleIcon className="h-3 w-3 text-primary" />
            )}
            <span className="text-xs text-muted-foreground capitalize">
              {item.bottleType} bottle
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold text-primary">
            OMR {item.price.toFixed(3)}
          </span>
          <span className="text-xs text-muted-foreground">
            × {item.quantity}
          </span>
          <span className="text-xs font-medium text-foreground">
            = OMR {(item.price * item.quantity).toFixed(3)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center border rounded-md bg-background">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-muted"
            onClick={() =>
              updateQuantity(item.id, item.quantity - 1, item.uniqueId)
            }
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2 text-sm font-medium w-8 text-center min-w-[2rem]">
            {item.quantity}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-muted"
            onClick={() =>
              updateQuantity(item.id, item.quantity + 1, item.uniqueId)
            }
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => removeFromCart(item.id, item.uniqueId)}
        >
          <X className="h-3.5 w-3.5" />
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

  // Volume modal states
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [selectedOil, setSelectedOil] = useState<any | null>(null);
  const [selectedVolumes, setSelectedVolumes] = useState<
    Array<{
      size: string;
      price: number;
      quantity: number;
      bottleType?: "open" | "closed";
    }>
  >([]);

  // Bottle type dialog states
  const [showBottleTypeDialog, setShowBottleTypeDialog] = useState(false);
  const [currentBottleVolumeSize, setCurrentBottleVolumeSize] = useState<
    string | null
  >(null);

  // Get real POS data
  const { lubricantProducts, products, brands } = useIntegratedPOSData();

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
            bottleType: product.bottleType,
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
      setSelectedOil(lubricant);
      setSelectedVolumes([]);
      setIsVolumeModalOpen(true);
    },
    []
  );

  // Function to handle volume selection with bottle type prompt for smaller volumes
  const handleVolumeClick = useCallback(
    (volume: { size: string; price: number }) => {
      // For 4L and 5L, add directly without bottle type
      if (volume.size === "4L" || volume.size === "5L") {
        setSelectedVolumes((prev) => {
          const existing = prev.find((v) => v.size === volume.size);
          if (existing) {
            return prev.map((v) =>
              v.size === volume.size ? { ...v, quantity: v.quantity + 1 } : v
            );
          }
          return [...prev, { ...volume, quantity: 1 }];
        });
        return;
      }

      // For other volumes, show the bottle type dialog
      setCurrentBottleVolumeSize(volume.size);
      setShowBottleTypeDialog(true);
    },
    []
  );

  // Function to add volume with selected bottle type
  const addVolumeWithBottleType = useCallback(
    (size: string, bottleType: "open" | "closed") => {
      const volumeDetails = selectedOil?.volumes.find((v: any) => v.size === size);
      if (volumeDetails) {
        setSelectedVolumes((prev) => {
          const existing = prev.find(
            (v) => v.size === size && v.bottleType === bottleType
          );
          if (existing) {
            return prev.map((v) =>
              v.size === size && v.bottleType === bottleType
                ? { ...v, quantity: v.quantity + 1 }
                : v
            );
          }
          return [...prev, { ...volumeDetails, quantity: 1, bottleType }];
        });
      }
      setShowBottleTypeDialog(false);
      setCurrentBottleVolumeSize(null);
    },
    [selectedOil]
  );

  // Handle quantity change for selected volumes
  const handleVolumeQuantityChange = useCallback(
    (size: string, bottleType: "open" | "closed" | undefined, change: number) => {
      setSelectedVolumes((prev) => {
        return prev
          .map((v) => {
            // Match by size and bottleType together
            const matches =
              v.size === size &&
              (bottleType === undefined
                ? v.bottleType === undefined
                : v.bottleType === bottleType);
            if (matches) {
              return { ...v, quantity: Math.max(0, v.quantity + change) };
            }
            return v;
          })
          .filter((v) => v.quantity > 0);
      });
    },
    []
  );

  // Handle adding selected volumes to cart
  const handleAddSelectedToCart = useCallback(() => {
    selectedVolumes.forEach((volume) => {
      if (selectedOil) {
        const details =
          volume.size +
          (volume.bottleType ? ` (${volume.bottleType} bottle)` : "");

        addToCart(
          {
            ...selectedOil,
            price: volume.price,
            bottleType: volume.bottleType,
          },
          details,
          volume.quantity
        );
      }
    });
    setIsVolumeModalOpen(false);
    setSelectedVolumes([]);
    setSelectedOil(null);
    
    toast({
      title: "Items Added",
      description: `${selectedVolumes.length} volume(s) added to transfer bill`,
    });
  }, [selectedVolumes, selectedOil, addToCart, toast]);

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
              placeholder="Search products or brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
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
                className={`flex items-center gap-2 justify-start transition-all duration-200 ${
                  activeCategory === category
                    ? "shadow-md"
                    : "hover:bg-accent hover:border-primary/20"
                }`}
              >
                {getCategoryIcon(category)}
                <span className="hidden sm:inline truncate font-medium">{category}</span>
                <span className="sm:hidden text-xs font-medium">
                  {category.split(" ")[0]}
                </span>
              </Button>
            ))}
          </div>
          {searchQuery && (
            <div className="text-xs text-muted-foreground px-1">
              {filteredBrands.length} brand{filteredBrands.length !== 1 ? "s" : ""} found
            </div>
          )}
        </div>

        {/* Products by Brand */}
        <ScrollArea className="h-[450px] lg:h-[480px]">
          <div className="space-y-3 p-1">
            {filteredBrands.map((brand) => {
              const brandProducts = getProductsForBrand(brand);
              if (brandProducts.length === 0) return null;

              const isExpanded = expandedBrand === brand;

              return (
                <div
                  key={brand}
                  className="border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-4 h-auto hover:bg-accent/50 transition-colors"
                    onClick={() => setExpandedBrand(isExpanded ? null : brand)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
                        <BrandLogo brand={brand} brands={brands} />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{brand}</h3>
                        <p className="text-sm text-muted-foreground">
                          {brandProducts.length} product
                          {brandProducts.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {brandProducts.length}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </Button>

                  {isExpanded && (
                    <div className="p-4 pt-2 border-t bg-muted/30">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {brandProducts.map((product) => {
                          const productImageUrl = (product as any).imageUrl || (product as any).image;
                          const productPrice = product.basePrice || product.price || 0;
                          const isAvailable = (product as any).isAvailable !== false;

                          return (
                            <Button
                              key={product.id}
                              variant="outline"
                              className="h-auto min-h-[160px] flex flex-col items-center justify-between p-3 hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] transition-all duration-200 overflow-hidden border-2 bg-card group"
                              onClick={() => {
                                if (activeCategory === "Lubricants") {
                                  handleLubricantSelect(product);
                                } else {
                                  addToCart(product);
                                }
                              }}
                            >
                              <div className="mb-2 flex justify-center w-full">
                                <div className="relative">
                                  <ProductImage
                                    product={{
                                      id: product.id,
                                      name: product.name,
                                      brand: product.brand,
                                      category: activeCategory,
                                      imageUrl: productImageUrl || undefined,
                                      ...(product as any),
                                    }}
                                    size="lg"
                                    className="shadow-md ring-2 ring-border/30 group-hover:ring-primary/30 transition-all duration-200"
                                  />
                                  {!isAvailable && (
                                    <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                                      <span className="text-xs font-medium text-muted-foreground">Out of Stock</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-center flex-1 flex flex-col justify-between min-h-0 gap-1.5 w-full">
                                <span className="text-xs font-semibold line-clamp-2 leading-tight text-foreground min-h-[2.5rem] flex items-center justify-center">
                                  {product.name}
                                </span>
                                <div className="flex flex-col gap-1">
                                  {product.type && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 w-fit mx-auto">
                                      {product.type}
                                    </Badge>
                                  )}
                                  <span className="text-sm text-primary font-bold">
                                    OMR {productPrice.toFixed(3)}
                                  </span>
                                </div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredBrands.length === 0 && (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center space-y-2">
                  <Package className="h-10 w-10 mx-auto opacity-50" />
                  <p className="text-sm font-medium">No products found</p>
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
      <Card className="w-full lg:w-80 flex flex-col shadow-lg border-2">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-semibold">Transfer Bill</span>
            </span>
            <Badge variant="secondary" className="text-sm font-semibold">
              {cart.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 opacity-50" />
                </div>
                <div>
                  <p className="text-sm font-medium">No items selected</p>
                  <p className="text-xs mt-1">Add products to create transfer bill</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-2 px-2 max-h-60 lg:max-h-80">
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
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                  <span className="font-semibold text-base">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    OMR {cartTotal.toFixed(3)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="w-full hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <div className="text-xs text-muted-foreground text-center pt-1">
                  {cart.length} item{cart.length !== 1 ? "s" : ""} • Total: OMR{" "}
                  {cartTotal.toFixed(3)}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Volume Selection Modal */}
      <Dialog open={isVolumeModalOpen} onOpenChange={setIsVolumeModalOpen}>
        <DialogContent className="w-[90%] max-w-[500px] p-4 sm:p-6 rounded-lg">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="text-base sm:text-xl font-semibold">
              {selectedOil?.brand} - {selectedOil?.type}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Select the volume for this lubricant product
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] border-2 border-border rounded-lg overflow-hidden bg-muted">
              {selectedOil?.image ? (
                <Image
                  src={selectedOil.image}
                  alt={`${selectedOil.brand} ${selectedOil.type}`}
                  className="object-contain p-2"
                  fill
                  sizes="(max-width: 768px) 120px, 160px"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Volume options grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {selectedOil?.volumes.map((volume: any) => (
                <Button
                  key={`volume-button-${volume.size}`}
                  variant="outline"
                  className="h-auto py-2 sm:py-3 px-2 sm:px-4 flex flex-col items-center gap-1 hover:bg-accent"
                  onClick={() => handleVolumeClick(volume)}
                >
                  <div className="text-sm sm:text-base font-medium">
                    {volume.size}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    OMR {volume.price.toFixed(3)}
                  </div>
                </Button>
              ))}
            </div>

            {/* Selected volumes list */}
            {selectedVolumes.length > 0 && (
              <div className="border rounded-lg">
                <div className="h-[180px] sm:h-[220px] overflow-y-auto scrollbar-none">
                  <div className="px-2 sm:px-3 py-2">
                    {selectedVolumes.map((volume, index) => (
                      <div
                        key={`${volume.size}-${volume.bottleType || "default"}`}
                        className={cn(
                          "flex flex-col py-1.5",
                          index === selectedVolumes.length - 1 && "mb-2 sm:mb-4"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() =>
                                handleVolumeQuantityChange(
                                  volume.size,
                                  volume.bottleType,
                                  -1
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-5 text-center text-sm">
                              {volume.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() =>
                                handleVolumeQuantityChange(
                                  volume.size,
                                  volume.bottleType,
                                  1
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-[60px_24px_1fr] items-center min-w-0 flex-1">
                            <span className="font-medium text-sm">
                              {volume.size}
                            </span>

                            <div className="flex items-center justify-center">
                              {volume.bottleType &&
                                (volume.bottleType === "closed" ? (
                                  <ClosedBottleIcon className="h-4 w-4 text-primary flex-shrink-0" />
                                ) : (
                                  <OpenBottleIcon className="h-4 w-4 text-primary flex-shrink-0" />
                                ))}
                            </div>

                            <span className="font-medium text-sm text-right w-full">
                              OMR{" "}
                              {(volume.price * volume.quantity).toFixed(3)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2 sm:gap-3 pt-2">
              <Button
                variant="outline"
                className="px-2 sm:px-6 text-sm sm:text-base"
                onClick={() => {
                  setIsVolumeModalOpen(false);
                  setSelectedVolumes([]);
                  setSelectedOil(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="px-2 sm:px-6 text-sm sm:text-base"
                onClick={handleAddSelectedToCart}
                disabled={selectedVolumes.length === 0}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottle Type Selection Dialog */}
      <Dialog
        open={showBottleTypeDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowBottleTypeDialog(false);
            setCurrentBottleVolumeSize(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
          <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
            <DialogTitle className="text-center text-xl">
              Select Bottle Type
            </DialogTitle>
            <DialogDescription className="sr-only">
              Choose whether to sell from a closed or open bottle
            </DialogDescription>
          </DialogHeader>

          <div className="p-6">
            <div className="text-center mb-4">
              <div className="text-muted-foreground">
                For {currentBottleVolumeSize} volume
              </div>
              <div className="font-semibold text-lg mt-1">
                {selectedOil?.brand} {selectedOil?.type}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Button
                variant="outline"
                className="h-40 flex flex-col items-center justify-center gap-2 px-2 hover:bg-accent rounded-xl border-2 hover:border-primary min-w-[120px] max-w-[180px]"
                onClick={() =>
                  addVolumeWithBottleType(currentBottleVolumeSize!, "closed")
                }
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <ClosedBottleIcon className="h-10 w-10 text-primary" />
                </div>
                <span
                  className="font-medium text-base text-center whitespace-normal break-words w-full"
                  style={{ lineHeight: 1 }}
                >
                  Closed Bottle
                </span>
                <span
                  className="text-xs text-muted-foreground text-center whitespace-normal break-words w-full"
                  style={{ lineHeight: 1 }}
                >
                  Factory sealed
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-40 flex flex-col items-center justify-center gap-2 px-2 hover:bg-accent rounded-xl border-2 hover:border-primary min-w-[120px] max-w-[180px]"
                onClick={() =>
                  addVolumeWithBottleType(currentBottleVolumeSize!, "open")
                }
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <OpenBottleIcon className="h-10 w-10 text-primary" />
                </div>
                <span
                  className="font-medium text-base text-center whitespace-normal break-words w-full"
                  style={{ lineHeight: 1 }}
                >
                  Open Bottle
                </span>
                <span
                  className="text-xs text-muted-foreground text-center whitespace-normal break-words w-full"
                  style={{ lineHeight: 1 }}
                >
                  Previously opened
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
