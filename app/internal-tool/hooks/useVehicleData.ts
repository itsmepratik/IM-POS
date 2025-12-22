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
}

export interface FilterProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
}

export const useVehicleData = () => {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [engines, setEngines] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  
  const [lubricants, setLubricants] = useState<LubricantProduct[]>([]);
  const [filterProduct, setFilterProduct] = useState<FilterProduct | null>(null);
  
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
        fetchFilterProduct(data.oil_filter_part_number);
      } else {
        setFilterProduct(null);
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
          stock: p.inventory?.[0]?.total_stock || 0
        };
      });
      setLubricants(mappedLubricants);
    }
  };

  const fetchFilterProduct = async (partNumber: string) => {
    // Determine if we have this part in our products table
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        inventory (
          selling_price,
          total_stock
        )
      `)
      .eq("name", partNumber)
      .maybeSingle(); // Use maybeSingle to handle 'not found' without error

    if (data) {
      setFilterProduct({
        id: data.id,
        name: data.name,
        price: data.inventory?.[0]?.selling_price || 0,
        stock: data.inventory?.[0]?.total_stock || 0,
        isAvailable: true
      });
    } else {
      // Product not found in our database
      setFilterProduct({
        id: "",
        name: partNumber,
        price: 0,
        stock: 0,
        isAvailable: false
      });
    }
  };

  return {
    makes,
    models,
    years,
    engines,
    vehicle,
    lubricants,
    filterProduct,
    loading,
    fetchModels,
    fetchYears,
    fetchEngines,
    fetchVehicleDetails,
    setVehicle
  };
};
