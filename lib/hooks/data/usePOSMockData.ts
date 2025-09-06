"use client";

import { useMemo } from "react";

// Complete POS data types matching original structure
export interface LubricantProduct {
  id: number;
  brand: string;
  name: string;
  basePrice: number;
  type: string;
  image?: string;
  volumes: {
    size: string;
    price: number;
  }[];
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: "Filters" | "Parts" | "Additives & Fluids";
  brand?: string;
  type?: string;
}

export interface POSCatalogData {
  lubricantProducts: LubricantProduct[];
  products: Product[];
  filterBrands: string[];
  filterTypes: string[];
  partBrands: string[];
  partTypes: string[];
  lubricantBrands: string[];
}

/**
 * Hook that provides mock data for a POS (Point of Sale) catalog.
 * @returns {POSCatalogData} An object containing arrays of lubricant products, other products, and derived data such as brands and types.
 */
export function usePOSMockData(): POSCatalogData {
  // Complete original lubricant products data
  const lubricantProducts: LubricantProduct[] = useMemo(
    () => [
      {
        id: 101,
        brand: "Toyota",
        name: "0W-20",
        basePrice: 39.99,
        type: "0W-20",
        image: "/oils/toyota-0w20.jpg",
        volumes: [
          { size: "5L", price: 39.99 },
          { size: "4L", price: 34.99 },
          { size: "1L", price: 11.99 },
          { size: "500ml", price: 6.99 },
          { size: "250ml", price: 3.99 },
        ],
      },
      {
        id: 102,
        brand: "Toyota",
        name: "5W-30",
        basePrice: 39.99,
        type: "5W-30",
        image: "/oils/toyota-5w30.jpg",
        volumes: [
          { size: "5L", price: 39.99 },
          { size: "4L", price: 34.99 },
          { size: "1L", price: 11.99 },
          { size: "500ml", price: 6.99 },
          { size: "250ml", price: 3.99 },
        ],
      },
      {
        id: 103,
        brand: "Toyota",
        name: "10W-30",
        basePrice: 39.99,
        type: "10W-30",
        image: "/oils/toyota-10w30.jpg",
        volumes: [
          { size: "5L", price: 39.99 },
          { size: "4L", price: 34.99 },
          { size: "1L", price: 11.99 },
          { size: "500ml", price: 6.99 },
          { size: "250ml", price: 3.99 },
        ],
      },
      {
        id: 201,
        brand: "Shell",
        name: "0W-20",
        basePrice: 45.99,
        type: "0W-20",
        image: "/oils/shell-0w20.jpg",
        volumes: [
          { size: "5L", price: 45.99 },
          { size: "4L", price: 39.99 },
          { size: "1L", price: 13.99 },
          { size: "500ml", price: 7.99 },
          { size: "250ml", price: 4.99 },
        ],
      },
      {
        id: 202,
        brand: "Shell",
        name: "5W-30",
        basePrice: 45.99,
        type: "5W-30",
        image: "/oils/shell-5w30.jpg",
        volumes: [
          { size: "5L", price: 45.99 },
          { size: "4L", price: 39.99 },
          { size: "1L", price: 13.99 },
          { size: "500ml", price: 7.99 },
          { size: "250ml", price: 4.99 },
        ],
      },
      {
        id: 203,
        brand: "Shell",
        name: "10W-40",
        basePrice: 35.99,
        type: "10W-40",
        image: "/oils/shell-10w40.jpg",
        volumes: [
          { size: "5L", price: 35.99 },
          { size: "4L", price: 31.99 },
          { size: "1L", price: 11.99 },
          { size: "500ml", price: 6.99 },
          { size: "250ml", price: 3.99 },
        ],
      },
      {
        id: 301,
        brand: "Lexus",
        name: "0W-20",
        basePrice: 49.99,
        type: "0W-20",
        image: "/oils/lexus-0w20.jpg",
        volumes: [
          { size: "5L", price: 49.99 },
          { size: "4L", price: 43.99 },
          { size: "1L", price: 14.99 },
          { size: "500ml", price: 8.99 },
          { size: "250ml", price: 5.99 },
        ],
      },
      {
        id: 302,
        brand: "Lexus",
        name: "5W-30",
        basePrice: 49.99,
        type: "5W-30",
        image: "/oils/lexus-5w30.jpg",
        volumes: [
          { size: "5L", price: 49.99 },
          { size: "4L", price: 43.99 },
          { size: "1L", price: 14.99 },
          { size: "500ml", price: 8.99 },
          { size: "250ml", price: 5.99 },
        ],
      },
    ],
    []
  );

  // Complete original products data with all filters, parts, and additives
  const products: Product[] = useMemo(
    () => [
      // Toyota Filters
      {
        id: 3,
        name: "Oil Filter - Standard",
        price: 12.99,
        category: "Filters",
        brand: "Toyota",
        type: "Oil Filter",
      },
      {
        id: 4,
        name: "Air Filter - Standard",
        price: 15.99,
        category: "Filters",
        brand: "Toyota",
        type: "Air Filter",
      },
      {
        id: 5,
        name: "Air Filter - Medium",
        price: 17.99,
        category: "Filters",
        brand: "Toyota",
        type: "Air Filter",
      },
      {
        id: 6,
        name: "Cabin Filter - Standard",
        price: 11.99,
        category: "Filters",
        brand: "Toyota",
        type: "Cabin Filter",
      },
      {
        id: 7,
        name: "Cabin Filter - Deluxe",
        price: 25.99,
        category: "Filters",
        brand: "Toyota",
        type: "Cabin Filter",
      },
      {
        id: 8,
        name: "Oil Filter - Premium",
        price: 19.99,
        category: "Filters",
        brand: "Toyota",
        type: "Oil Filter",
      },
      {
        id: 9,
        name: "Oil Filter - Economy",
        price: 9.99,
        category: "Filters",
        brand: "Toyota",
        type: "Oil Filter",
      },
      // Honda Filters
      {
        id: 31,
        name: "Oil Filter - Basic",
        price: 11.99,
        category: "Filters",
        brand: "Honda",
        type: "Oil Filter",
      },
      {
        id: 32,
        name: "Air Filter - Basic",
        price: 14.99,
        category: "Filters",
        brand: "Honda",
        type: "Air Filter",
      },
      {
        id: 33,
        name: "Air Filter - Medium",
        price: 16.99,
        category: "Filters",
        brand: "Honda",
        type: "Air Filter",
      },
      {
        id: 34,
        name: "Cabin Filter - Basic",
        price: 12.99,
        category: "Filters",
        brand: "Honda",
        type: "Cabin Filter",
      },
      {
        id: 35,
        name: "Cabin Filter - Deluxe",
        price: 23.99,
        category: "Filters",
        brand: "Honda",
        type: "Cabin Filter",
      },
      {
        id: 36,
        name: "Oil Filter - Premium",
        price: 18.99,
        category: "Filters",
        brand: "Honda",
        type: "Oil Filter",
      },
      {
        id: 37,
        name: "Oil Filter - Economy",
        price: 8.99,
        category: "Filters",
        brand: "Honda",
        type: "Oil Filter",
      },
      // Nissan Filters
      {
        id: 41,
        name: "Oil Filter - Standard",
        price: 13.99,
        category: "Filters",
        brand: "Nissan",
        type: "Oil Filter",
      },
      {
        id: 42,
        name: "Air Filter - Standard",
        price: 16.99,
        category: "Filters",
        brand: "Nissan",
        type: "Air Filter",
      },
      {
        id: 43,
        name: "Air Filter - Medium",
        price: 18.99,
        category: "Filters",
        brand: "Nissan",
        type: "Air Filter",
      },
      {
        id: 44,
        name: "Cabin Filter - Standard",
        price: 13.99,
        category: "Filters",
        brand: "Nissan",
        type: "Cabin Filter",
      },
      {
        id: 45,
        name: "Cabin Filter - Deluxe",
        price: 26.99,
        category: "Filters",
        brand: "Nissan",
        type: "Cabin Filter",
      },
      {
        id: 46,
        name: "Oil Filter - Premium",
        price: 20.99,
        category: "Filters",
        brand: "Nissan",
        type: "Oil Filter",
      },
      {
        id: 47,
        name: "Oil Filter - Economy",
        price: 10.99,
        category: "Filters",
        brand: "Nissan",
        type: "Oil Filter",
      },

      // Additives & Fluids
      {
        id: 7001,
        name: "Fuel System Cleaner",
        price: 14.99,
        category: "Additives & Fluids",
        brand: "Shell",
      },
      {
        id: 8001,
        name: "Oil Treatment",
        price: 11.99,
        category: "Additives & Fluids",
        brand: "Shell",
      },
      {
        id: 9001,
        name: "Diesel Additive",
        price: 16.99,
        category: "Additives & Fluids",
        brand: "Shell",
      },
      {
        id: 9002,
        name: "Engine Flush",
        price: 19.99,
        category: "Additives & Fluids",
        brand: "Toyota",
      },
      {
        id: 9003,
        name: "Radiator Coolant",
        price: 12.99,
        category: "Additives & Fluids",
        brand: "Toyota",
      },
      {
        id: 9004,
        name: "Fuel Injector Cleaner",
        price: 15.99,
        category: "Additives & Fluids",
        brand: "Toyota",
      },
      {
        id: 9005,
        name: "Octane Booster",
        price: 9.99,
        category: "Additives & Fluids",
        brand: "Lexus",
      },
      {
        id: 9006,
        name: "Transmission Fluid",
        price: 22.99,
        category: "Additives & Fluids",
        brand: "Lexus",
      },
      {
        id: 9007,
        name: "Power Steering Fluid",
        price: 13.99,
        category: "Additives & Fluids",
        brand: "Lexus",
      },
      {
        id: 9008,
        name: "Brake Fluid",
        price: 8.99,
        category: "Additives & Fluids",
        brand: "Castrol",
      },
      {
        id: 9009,
        name: "Engine Stop Leak",
        price: 17.99,
        category: "Additives & Fluids",
        brand: "Castrol",
      },
      {
        id: 9010,
        name: "Oil Stabilizer",
        price: 14.99,
        category: "Additives & Fluids",
        brand: "Castrol",
      },

      // Parts - Miscellaneous Parts
      {
        id: 1001,
        name: "Brake Pads - Front",
        price: 45.99,
        category: "Parts",
        brand: "Toyota",
        type: "Miscellaneous Parts",
      },
      {
        id: 1002,
        name: "Brake Pads - Rear",
        price: 39.99,
        category: "Parts",
        brand: "Toyota",
        type: "Miscellaneous Parts",
      },
      {
        id: 1003,
        name: "Brake Rotor - Front",
        price: 79.99,
        category: "Parts",
        brand: "Toyota",
        type: "Miscellaneous Parts",
      },
      {
        id: 1004,
        name: "Brake Rotor - Rear",
        price: 69.99,
        category: "Parts",
        brand: "Toyota",
        type: "Miscellaneous Parts",
      },
      {
        id: 1008,
        name: "Water Pump",
        price: 89.99,
        category: "Parts",
        brand: "Toyota",
        type: "Miscellaneous Parts",
      },
      {
        id: 1009,
        name: "Thermostat",
        price: 22.99,
        category: "Parts",
        brand: "Toyota",
        type: "Miscellaneous Parts",
      },
      {
        id: 1010,
        name: "Radiator",
        price: 159.99,
        category: "Parts",
        brand: "Toyota",
        type: "Miscellaneous Parts",
      },
      // Lexus Miscellaneous Parts
      {
        id: 1011,
        name: "Brake Pads - Front",
        price: 65.99,
        category: "Parts",
        brand: "Lexus",
        type: "Miscellaneous Parts",
      },
      {
        id: 1012,
        name: "Brake Pads - Rear",
        price: 59.99,
        category: "Parts",
        brand: "Lexus",
        type: "Miscellaneous Parts",
      },
      {
        id: 1013,
        name: "Brake Rotor - Front",
        price: 99.99,
        category: "Parts",
        brand: "Lexus",
        type: "Miscellaneous Parts",
      },
      {
        id: 1014,
        name: "Brake Rotor - Rear",
        price: 89.99,
        category: "Parts",
        brand: "Lexus",
        type: "Miscellaneous Parts",
      },
      // Honda Miscellaneous Parts
      {
        id: 1017,
        name: "Brake Pads - Front",
        price: 42.99,
        category: "Parts",
        brand: "Honda",
        type: "Miscellaneous Parts",
      },
      {
        id: 1018,
        name: "Brake Pads - Rear",
        price: 38.99,
        category: "Parts",
        brand: "Honda",
        type: "Miscellaneous Parts",
      },
      {
        id: 1019,
        name: "Brake Rotor - Front",
        price: 69.99,
        category: "Parts",
        brand: "Honda",
        type: "Miscellaneous Parts",
      },
      {
        id: 1020,
        name: "Alternator",
        price: 129.99,
        category: "Parts",
        brand: "Honda",
        type: "Miscellaneous Parts",
      },
      {
        id: 1021,
        name: "Starter Motor",
        price: 139.99,
        category: "Parts",
        brand: "Honda",
        type: "Miscellaneous Parts",
      },
      // Nissan Miscellaneous Parts
      {
        id: 1022,
        name: "Brake Pads - Front",
        price: 39.99,
        category: "Parts",
        brand: "Nissan",
        type: "Miscellaneous Parts",
      },
      {
        id: 1023,
        name: "Brake Pads - Rear",
        price: 36.99,
        category: "Parts",
        brand: "Nissan",
        type: "Miscellaneous Parts",
      },
      {
        id: 1024,
        name: "Oxygen Sensor",
        price: 49.99,
        category: "Parts",
        brand: "Nissan",
        type: "Miscellaneous Parts",
      },
      {
        id: 1025,
        name: "Mass Air Flow Sensor",
        price: 89.99,
        category: "Parts",
        brand: "Nissan",
        type: "Miscellaneous Parts",
      },
      {
        id: 1026,
        name: "Camshaft Position Sensor",
        price: 45.99,
        category: "Parts",
        brand: "Nissan",
        type: "Miscellaneous Parts",
      },

      // Batteries
      {
        id: 1027,
        name: "Standard Battery",
        price: 89.99,
        category: "Parts",
        brand: "Toyota",
        type: "Batteries",
      },
      {
        id: 1028,
        name: "Premium Battery",
        price: 129.99,
        category: "Parts",
        brand: "Toyota",
        type: "Batteries",
      },
      {
        id: 1029,
        name: "Economy Battery",
        price: 69.99,
        category: "Parts",
        brand: "Honda",
        type: "Batteries",
      },
      {
        id: 1030,
        name: "Heavy Duty Battery",
        price: 149.99,
        category: "Parts",
        brand: "Lexus",
        type: "Batteries",
      },
      {
        id: 1031,
        name: "Standard Battery",
        price: 84.99,
        category: "Parts",
        brand: "Nissan",
        type: "Batteries",
      },

      // Spark Plugs
      {
        id: 1032,
        name: "Standard Spark Plugs",
        price: 7.99,
        category: "Parts",
        brand: "Toyota",
        type: "Spark Plugs",
      },
      {
        id: 1033,
        name: "Iridium Spark Plugs",
        price: 19.99,
        category: "Parts",
        brand: "Toyota",
        type: "Spark Plugs",
      },
      {
        id: 1034,
        name: "Platinum Spark Plugs",
        price: 14.99,
        category: "Parts",
        brand: "Honda",
        type: "Spark Plugs",
      },
      {
        id: 1035,
        name: "Premium Spark Plugs",
        price: 22.99,
        category: "Parts",
        brand: "Lexus",
        type: "Spark Plugs",
      },
      {
        id: 1036,
        name: "Performance Spark Plugs",
        price: 24.99,
        category: "Parts",
        brand: "Nissan",
        type: "Spark Plugs",
      },
    ],
    []
  );

  // Derive organized data arrays
  const derivedData = useMemo(() => {
    const lubricantBrands = Array.from(
      new Set(lubricantProducts.map((oil) => oil.brand))
    );

    const filterBrands = Array.from(
      new Set(
        products
          .filter((p) => p.category === "Filters" && p.brand)
          .map((p) => p.brand!)
      )
    );

    const filterTypes = Array.from(
      new Set(
        products
          .filter((p) => p.category === "Filters" && p.type)
          .map((p) => p.type!)
      )
    );

    const partBrands = Array.from(
      new Set(
        products
          .filter((p) => p.category === "Parts" && p.brand)
          .map((p) => p.brand!)
      )
    );

    const partTypes = Array.from(
      new Set(
        products
          .filter(
            (p) =>
              p.category === "Parts" &&
              p.type &&
              ["Miscellaneous Parts", "Spark Plugs", "Batteries"].includes(
                p.type
              )
          )
          .map((p) => p.type!)
      )
    );

    return {
      lubricantBrands,
      filterBrands,
      filterTypes,
      partBrands,
      partTypes,
    };
  }, [lubricantProducts, products]);

  return {
    lubricantProducts,
    products,
    ...derivedData,
  };
}
