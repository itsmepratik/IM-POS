"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { CartItem } from "../types";

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    itemOrProduct: CartItem[] | { id: number; name: string; price: number },
    details?: string,
    quantity?: number,
    source?: string,
    bottleType?: string,
  ) => void;
  removeFromCart: (uniqueId: string) => void;
  updateQuantity: (uniqueId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("pos_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("pos_cart", JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  const addToCart = (
    itemOrProduct: CartItem[] | { id: number; name: string; price: number },
    details?: string,
    quantity?: number,
    source?: string,
    bottleType?: string,
  ) => {
    // Support both signatures:
    // 1. Array: addToCart(CartItem[])
    // 2. Single item: addToCart(product, details?, quantity?, source?, bottleType?)
    let items: CartItem[];

    if (Array.isArray(itemOrProduct)) {
      items = itemOrProduct;
    } else {
      // Build a CartItem from the legacy single-item signature
      const product = itemOrProduct;
      const qty = quantity ?? 1;
      const uniqueId = `${product.id}-${details || ""}-${source || ""}-${bottleType || ""}-${Date.now()}`;
      items = [
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          details: details || "",
          uniqueId,
          source: source as "OPEN" | "CLOSED" | undefined,
          bottleType: bottleType as "open" | "closed" | undefined,
        } as CartItem,
      ];
    }

    setCart((prevCart) => {
      const newCart = [...prevCart];

      items.forEach((newItem) => {
        const existingIndex = newCart.findIndex(
          (item) => item.uniqueId === newItem.uniqueId,
        );

        if (existingIndex >= 0) {
          // Update existing item
          newCart[existingIndex] = {
            ...newCart[existingIndex],
            quantity: newCart[existingIndex].quantity + newItem.quantity,
          };
        } else {
          // Add new item
          newCart.push(newItem);
        }
      });

      return newCart;
    });
  };

  const removeFromCart = (uniqueId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.uniqueId !== uniqueId),
    );
  };

  const updateQuantity = (uniqueId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(uniqueId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.uniqueId === uniqueId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
