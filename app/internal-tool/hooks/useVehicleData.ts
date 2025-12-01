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

export const useVehicleData = () => {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [engines, setEngines] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchMakes();
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
    }
    setLoading(false);
  };

  return {
    makes,
    models,
    years,
    engines,
    vehicle,
    loading,
    fetchModels,
    fetchYears,
    fetchEngines,
    fetchVehicleDetails,
    setVehicle // Allow resetting vehicle
  };
};
