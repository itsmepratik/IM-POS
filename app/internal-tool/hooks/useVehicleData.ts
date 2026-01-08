import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";

export interface VehicleData {
  id: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  oil_capacity: number;
  oil_filter_part_number: string | null;
}

export interface LubricantProduct {
  id: string;
  name: string;
  pricePerLiter: number;
  type: string;
  stock: number;
  imageUrl: string | null;
  brand: string;
  specification: string | null;
}

export interface FilterProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  imageUrl: string | null;
  specification: string | null;
  brand: string | null;
}

export const useVehicleData = () => {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [engines, setEngines] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  
  const [lubricants, setLubricants] = useState<LubricantProduct[]>([]);
  const [filterProducts, setFilterProducts] = useState<FilterProduct[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchMakes();
    fetchLubricants();
  }, []);

  const fetchMakes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select("make")
      .order("make");

    if (data) {
      const uniqueMakes = Array.from(new Set(data.map((item) => item.make)));
      setMakes(uniqueMakes);
    }
    setLoading(false);
  };

  const fetchModels = async (make: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select("model")
      .eq("make", make)
      .order("model");

    if (data) {
      const uniqueModels = Array.from(new Set(data.map((item) => item.model)));
      setModels(uniqueModels);
    }
    setLoading(false);
  };

  const fetchYears = async (make: string, model: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select("year")
      .eq("make", make)
      .eq("model", model)
      .order("year", { ascending: false });

    if (data) {
      const uniqueYears = Array.from(new Set(data.map((item) => item.year)));
      setYears(uniqueYears);
    }
    setLoading(false);
  };

  const fetchEngines = async (make: string, model: string, year: number) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select("engine")
      .eq("make", make)
      .eq("model", model)
      .eq("year", year)
      .order("engine");

    if (data) {
      const uniqueEngines = Array.from(new Set(data.map((item) => item.engine)));
      setEngines(uniqueEngines);
    }
    setLoading(false);
  };

  const fetchVehicleDetails = async (
    make: string,
    model: string,
    year: number,
    engine: string
  ) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("make", make)
      .eq("model", model)
      .eq("year", year)
      .eq("engine", engine)
      .single();

    if (data) {
      setVehicle(data);
      if (data.oil_filter_part_number) {
        fetchFilterProducts(data.oil_filter_part_number);
      } else {
        setFilterProducts([]);
      }
    }
    setLoading(false);
  };

  const parseVolume = (volStr: string): number => {
    const clean = volStr.toLowerCase().replace(/\s/g, "");
    if (clean.includes("ml")) {
      return parseFloat(clean) / 1000;
    }
    return parseFloat(clean);
  };

  const fetchLubricants = async () => {
    // Lubricants Category ID: c9a58df4-eb3d-424a-a9d6-7c26f3f57c1b
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        product_type,
        image_url,
        specification,
        inventory (
          total_stock
        ),
        product_volumes (
          volume_description,
          selling_price
        ),
        brands (
          name
        )
      `)
      .eq("category_id", "c9a58df4-eb3d-424a-a9d6-7c26f3f57c1b");

    if (products) {
      const mappedLubricants: LubricantProduct[] = products.map((p: any) => {
        // Find highest volume
        let maxVol = 0;
        let priceForMaxVol = 0;

        if (p.product_volumes && p.product_volumes.length > 0) {
          p.product_volumes.forEach((v: any) => {
            const vol = parseVolume(v.volume_description);
            if (vol > maxVol) {
              maxVol = vol;
              priceForMaxVol = v.selling_price;
            }
          });
        }
        
        // Fallback or calculation
        const pricePerLiter = maxVol > 0 ? (priceForMaxVol / maxVol) : 0;

        return {
          id: p.id,
          name: p.name,
          brand: p.brands?.name || "Unknown Brand",
          type: p.product_type || "Standard",
          pricePerLiter: pricePerLiter,
          stock: p.inventory?.[0]?.total_stock || 0,
          imageUrl: p.image_url,
          specification: p.specification,
        };
      });
      setLubricants(mappedLubricants);
    }
  };

  const fetchFilterProducts = async (partNumber: string) => {
    setFilterLoading(true);
    
    // 1. Standard cleaning
    const stripped = partNumber.replace(/[^a-zA-Z0-9]/g, "");
    
    // 2. Format Variants
    const variants = [
      partNumber, // Original (e.g. 90915-YZZN1)
      stripped,   // Stripped (e.g. 90915YZZN1)
      partNumber.replace(/-/g, " "), // Hyphens to spaces (e.g. 90915 YZZN1)
    ];

    // 3. Add 4-4-2 Pattern (e.g. 6845 4858 B1 from 68454858B1)
    if (stripped.length === 10) {
        variants.push(`${stripped.substring(0, 4)} ${stripped.substring(4, 8)} ${stripped.substring(8)}`);
    }

    // 4. Add 5-5 Pattern (e.g. 90915 YZZN1 from 90915YZZN1) if not covered
    if (stripped.length === 10) {
       variants.push(`${stripped.substring(0, 5)} ${stripped.substring(5)}`);
    }

    // Remove duplicates
    const uniqueVariants = Array.from(new Set(variants));

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        image_url,
        specification,
        brands (
          name
        ),
        inventory (
          selling_price,
          total_stock
        )
      `)
      .in("name", uniqueVariants);

    if (data && data.length > 0) {
      const products: FilterProduct[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.inventory?.[0]?.selling_price || 0,
        stock: p.inventory?.[0]?.total_stock || 0,
        isAvailable: true,
        imageUrl: p.image_url,
        specification: p.specification,
        brand: p.brands?.name || null
      }));
      setFilterProducts(products);
    } else {
      setFilterProducts([]);
    }
    setFilterLoading(false);
  };

  return {
    makes,
    models,
    years,
    engines,
    vehicle,
    lubricants,
    filterProducts,
    filterLoading,
    loading,
    fetchModels,
    fetchYears,
    fetchEngines,
    fetchVehicleDetails,
    setVehicle
  };
};
