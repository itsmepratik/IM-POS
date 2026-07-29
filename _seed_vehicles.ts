import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

// Vehicle data with oil capacities and filter part numbers
// Source: Real-world vehicle specifications for Middle East market
interface VehicleEntry {
  make: string;
  model: string;
  year: number;
  engine: string;
  oilCapacity: number;
  filters: Array<{
    partNumber: string;
    type: string;
    isPrimary: boolean;
    notes?: string;
  }>;
}

const vehicleData: VehicleEntry[] = [
  // ===== TOYOTA =====
  // Corolla
  {
    make: "Toyota", model: "Corolla", year: 2020, engine: "1.8L 2ZR-FE",
    oilCapacity: 4.2,
    filters: [
      { partNumber: "90915-YZZD4", type: "oil", isPrimary: true, notes: "Standard OEM" },
      { partNumber: "90915-YZZN1", type: "oil", isPrimary: false, notes: "Extended life" },
      { partNumber: "17801-21050", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Corolla", year: 2021, engine: "1.8L 2ZR-FAE",
    oilCapacity: 4.2,
    filters: [
      { partNumber: "90915-YZZD4", type: "oil", isPrimary: true },
      { partNumber: "90915-YZZN1", type: "oil", isPrimary: false },
      { partNumber: "17801-21050", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Corolla", year: 2022, engine: "2.0L M20A-FKS",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true, notes: "Newer engine" },
      { partNumber: "90915-YZZN1", type: "oil", isPrimary: false },
      { partNumber: "17801-21050", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Corolla", year: 2023, engine: "2.0L M20A-FKS",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true },
      { partNumber: "90915-YZZN1", type: "oil", isPrimary: false },
      { partNumber: "17801-21050", type: "air", isPrimary: true },
    ]
  },
  // Camry
  {
    make: "Toyota", model: "Camry", year: 2019, engine: "2.5L A25A-FKS",
    oilCapacity: 5.7,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true, notes: "Standard OEM" },
      { partNumber: "90915-YZZN2", type: "oil", isPrimary: false, notes: "Premium filter" },
      { partNumber: "17801-38020", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Camry", year: 2020, engine: "2.5L A25A-FKS",
    oilCapacity: 5.7,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true },
      { partNumber: "90915-YZZN2", type: "oil", isPrimary: false },
      { partNumber: "17801-38020", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Camry", year: 2021, engine: "2.5L A25A-FKS",
    oilCapacity: 5.7,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true },
      { partNumber: "90915-YZZN2", type: "oil", isPrimary: false },
      { partNumber: "17801-38020", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Camry", year: 2022, engine: "2.5L A25A-FKS",
    oilCapacity: 5.7,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true },
      { partNumber: "90915-YZZN2", type: "oil", isPrimary: false },
      { partNumber: "17801-38020", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Camry", year: 2023, engine: "2.5L A25A-FKS",
    oilCapacity: 5.7,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true },
      { partNumber: "90915-YZZN2", type: "oil", isPrimary: false },
      { partNumber: "17801-38020", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Camry", year: 2024, engine: "2.5L A25A-FKS",
    oilCapacity: 5.7,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true },
      { partNumber: "90915-YZZN2", type: "oil", isPrimary: false },
      { partNumber: "17801-38020", type: "air", isPrimary: true },
    ]
  },
  // Land Cruiser
  {
    make: "Toyota", model: "Land Cruiser", year: 2021, engine: "4.0L 1GR-FE V6",
    oilCapacity: 6.1,
    filters: [
      { partNumber: "90915-YZZD4", type: "oil", isPrimary: true, notes: "V6 engine" },
      { partNumber: "90915-YN105", type: "oil", isPrimary: false, notes: "Heavy duty" },
      { partNumber: "17801-38010", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Land Cruiser", year: 2022, engine: "4.0L 1GR-FE V6",
    oilCapacity: 6.1,
    filters: [
      { partNumber: "90915-YZZD4", type: "oil", isPrimary: true },
      { partNumber: "90915-YN105", type: "oil", isPrimary: false },
      { partNumber: "17801-38010", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Land Cruiser", year: 2023, engine: "4.0L 1GR-FE V6",
    oilCapacity: 6.1,
    filters: [
      { partNumber: "90915-YZZD4", type: "oil", isPrimary: true },
      { partNumber: "90915-YN105", type: "oil", isPrimary: false },
      { partNumber: "17801-38010", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Land Cruiser", year: 2024, engine: "3.5L V35A-FTS V6 Twin-Turbo",
    oilCapacity: 7.4,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true, notes: "New twin-turbo" },
      { partNumber: "90915-YZZN1", type: "oil", isPrimary: false },
      { partNumber: "17801-31020", type: "air", isPrimary: true },
    ]
  },
  // Hilux
  {
    make: "Toyota", model: "Hilux", year: 2020, engine: "2.7L 2TR-FE",
    oilCapacity: 5.5,
    filters: [
      { partNumber: "90915-YZZD4", type: "oil", isPrimary: true },
      { partNumber: "90915-YN105", type: "oil", isPrimary: false, notes: "Diesel equivalent" },
      { partNumber: "17801-38010", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Hilux", year: 2021, engine: "2.8L 1GD-FTV Diesel",
    oilCapacity: 6.5,
    filters: [
      { partNumber: "90915-YN105", type: "oil", isPrimary: true, notes: "Diesel engine" },
      { partNumber: "90915-YZZD4", type: "oil", isPrimary: false },
      { partNumber: "17801-30090", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Hilux", year: 2022, engine: "2.8L 1GD-FTV Diesel",
    oilCapacity: 6.5,
    filters: [
      { partNumber: "90915-YN105", type: "oil", isPrimary: true },
      { partNumber: "90915-YZZD4", type: "oil", isPrimary: false },
      { partNumber: "17801-30090", type: "air", isPrimary: true },
    ]
  },
  // RAV4
  {
    make: "Toyota", model: "RAV4", year: 2020, engine: "2.5L A25A-FKS",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true },
      { partNumber: "90915-YZZN1", type: "oil", isPrimary: false },
      { partNumber: "17801-38020", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "RAV4", year: 2021, engine: "2.5L A25A-FKS",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true },
      { partNumber: "90915-YZZN1", type: "oil", isPrimary: false },
      { partNumber: "17801-38020", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "RAV4", year: 2022, engine: "2.5L A25A-FKS Hybrid",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "90915-YZZE7", type: "oil", isPrimary: true, notes: "Hybrid compatible" },
      { partNumber: "90915-YZZN1", type: "oil", isPrimary: false },
      { partNumber: "17801-38020", type: "air", isPrimary: true },
    ]
  },
  // Prado
  {
    make: "Toyota", model: "Prado", year: 2020, engine: "2.7L 2TR-FE",
    oilCapacity: 5.5,
    filters: [
      { partNumber: "90915-YZZD4", type: "oil", isPrimary: true },
      { partNumber: "90915-YN105", type: "oil", isPrimary: false },
      { partNumber: "17801-38010", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Prado", year: 2021, engine: "2.8L 1GD-FTV Diesel",
    oilCapacity: 6.5,
    filters: [
      { partNumber: "90915-YN105", type: "oil", isPrimary: true, notes: "Diesel" },
      { partNumber: "90915-YZZD4", type: "oil", isPrimary: false },
      { partNumber: "17801-30090", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Toyota", model: "Prado", year: 2023, engine: "2.8L 1GD-FTV Diesel",
    oilCapacity: 6.5,
    filters: [
      { partNumber: "90915-YN105", type: "oil", isPrimary: true },
      { partNumber: "90915-YZZD4", type: "oil", isPrimary: false },
      { partNumber: "17801-30090", type: "air", isPrimary: true },
    ]
  },

  // ===== NISSAN =====
  // Sunny / Sentra
  {
    make: "Nissan", model: "Sunny", year: 2020, engine: "1.5L HR15DE",
    oilCapacity: 3.7,
    filters: [
      { partNumber: "15208-65F0E", type: "oil", isPrimary: true, notes: "Standard OEM" },
      { partNumber: "15208-4M500", type: "oil", isPrimary: false, notes: "Extended life" },
      { partNumber: "16546-3TA0A", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Nissan", model: "Sunny", year: 2021, engine: "1.5L HR15DE",
    oilCapacity: 3.7,
    filters: [
      { partNumber: "15208-65F0E", type: "oil", isPrimary: true },
      { partNumber: "15208-4M500", type: "oil", isPrimary: false },
      { partNumber: "16546-3TA0A", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Nissan", model: "Sunny", year: 2022, engine: "1.6L HR16DE",
    oilCapacity: 3.7,
    filters: [
      { partNumber: "15208-65F0E", type: "oil", isPrimary: true },
      { partNumber: "15208-4M500", type: "oil", isPrimary: false },
      { partNumber: "16546-3TA0A", type: "air", isPrimary: true },
    ]
  },
  // Altima
  {
    make: "Nissan", model: "Altima", year: 2020, engine: "2.5L QR25DE",
    oilCapacity: 4.9,
    filters: [
      { partNumber: "15208-65F0E", type: "oil", isPrimary: true },
      { partNumber: "15208-4M500", type: "oil", isPrimary: false },
      { partNumber: "16546-3TA0A", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Nissan", model: "Altima", year: 2021, engine: "2.5L VC-Turbo KR20DDET",
    oilCapacity: 4.9,
    filters: [
      { partNumber: "15208-65F0E", type: "oil", isPrimary: true, notes: "VC-Turbo engine" },
      { partNumber: "15208-4M500", type: "oil", isPrimary: false },
      { partNumber: "16546-3TA0A", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Nissan", model: "Altima", year: 2023, engine: "2.5L VC-Turbo KR20DDET",
    oilCapacity: 4.9,
    filters: [
      { partNumber: "15208-65F0E", type: "oil", isPrimary: true },
      { partNumber: "15208-4M500", type: "oil", isPrimary: false },
      { partNumber: "16546-3TA0A", type: "air", isPrimary: true },
    ]
  },
  // Patrol
  {
    make: "Nissan", model: "Patrol", year: 2020, engine: "5.6L VK56VD V8",
    oilCapacity: 6.6,
    filters: [
      { partNumber: "15208-9E000", type: "oil", isPrimary: true, notes: "V8 engine" },
      { partNumber: "15208-65F0E", type: "oil", isPrimary: false },
      { partNumber: "16546-7FJ00", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Nissan", model: "Patrol", year: 2021, engine: "5.6L VK56VD V8",
    oilCapacity: 6.6,
    filters: [
      { partNumber: "15208-9E000", type: "oil", isPrimary: true },
      { partNumber: "15208-65F0E", type: "oil", isPrimary: false },
      { partNumber: "16546-7FJ00", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Nissan", model: "Patrol", year: 2022, engine: "3.5L VR35DDTT V6 Twin-Turbo",
    oilCapacity: 5.5,
    filters: [
      { partNumber: "15208-65F0E", type: "oil", isPrimary: true, notes: "New twin-turbo V6" },
      { partNumber: "15208-9E000", type: "oil", isPrimary: false },
      { partNumber: "16546-7FJ00", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Nissan", model: "Patrol", year: 2023, engine: "3.5L VR35DDTT V6 Twin-Turbo",
    oilCapacity: 5.5,
    filters: [
      { partNumber: "15208-65F0E", type: "oil", isPrimary: true },
      { partNumber: "15208-9E000", type: "oil", isPrimary: false },
      { partNumber: "16546-7FJ00", type: "air", isPrimary: true },
    ]
  },
  // X-Trail
  {
    make: "Nissan", model: "X-Trail", year: 2021, engine: "2.5L QR25DE",
    oilCapacity: 4.9,
    filters: [
      { partNumber: "15208-65F0E", type: "oil", isPrimary: true },
      { partNumber: "15208-4M500", type: "oil", isPrimary: false },
      { partNumber: "16546-3TA0A", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Nissan", model: "X-Trail", year: 2022, engine: "1.5L VC-Turbo KR15DDT",
    oilCapacity: 4.7,
    filters: [
      { partNumber: "15208-65F0E", type: "oil", isPrimary: true },
      { partNumber: "15208-4M500", type: "oil", isPrimary: false },
      { partNumber: "16546-3TA0A", type: "air", isPrimary: true },
    ]
  },

  // ===== HONDA =====
  // Civic
  {
    make: "Honda", model: "Civic", year: 2020, engine: "1.5L L15B7 Turbo",
    oilCapacity: 3.5,
    filters: [
      { partNumber: "15400-5AA-A01", type: "oil", isPrimary: true, notes: "Turbo engine" },
      { partNumber: "15400-PLM-A01", type: "oil", isPrimary: false, notes: "Standard" },
      { partNumber: "17220-5AA-A00", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Honda", model: "Civic", year: 2021, engine: "1.5L L15B7 Turbo",
    oilCapacity: 3.5,
    filters: [
      { partNumber: "15400-5AA-A01", type: "oil", isPrimary: true },
      { partNumber: "15400-PLM-A01", type: "oil", isPrimary: false },
      { partNumber: "17220-5AA-A00", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Honda", model: "Civic", year: 2022, engine: "1.5L L15B7 Turbo",
    oilCapacity: 3.5,
    filters: [
      { partNumber: "15400-5AA-A01", type: "oil", isPrimary: true },
      { partNumber: "15400-PLM-A01", type: "oil", isPrimary: false },
      { partNumber: "17220-5AA-A00", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Honda", model: "Civic", year: 2023, engine: "1.5L L15BY Turbo",
    oilCapacity: 3.7,
    filters: [
      { partNumber: "15400-5AA-A01", type: "oil", isPrimary: true },
      { partNumber: "15400-PLM-A01", type: "oil", isPrimary: false },
      { partNumber: "17220-5AA-A00", type: "air", isPrimary: true },
    ]
  },
  // Accord
  {
    make: "Honda", model: "Accord", year: 2020, engine: "1.5L L15B7 Turbo",
    oilCapacity: 3.7,
    filters: [
      { partNumber: "15400-5AA-A01", type: "oil", isPrimary: true },
      { partNumber: "15400-PLM-A01", type: "oil", isPrimary: false },
      { partNumber: "17220-5AA-A00", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Honda", model: "Accord", year: 2021, engine: "2.0L L20C4 Turbo",
    oilCapacity: 4.4,
    filters: [
      { partNumber: "15400-5AA-A01", type: "oil", isPrimary: true, notes: "2.0T engine" },
      { partNumber: "15400-PLM-A01", type: "oil", isPrimary: false },
      { partNumber: "17220-5AA-A00", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Honda", model: "Accord", year: 2023, engine: "1.5L L15BY Turbo",
    oilCapacity: 3.7,
    filters: [
      { partNumber: "15400-5AA-A01", type: "oil", isPrimary: true },
      { partNumber: "15400-PLM-A01", type: "oil", isPrimary: false },
      { partNumber: "17220-5AA-A00", type: "air", isPrimary: true },
    ]
  },
  // CR-V
  {
    make: "Honda", model: "CR-V", year: 2020, engine: "1.5L L15B7 Turbo",
    oilCapacity: 3.7,
    filters: [
      { partNumber: "15400-5AA-A01", type: "oil", isPrimary: true },
      { partNumber: "15400-PLM-A01", type: "oil", isPrimary: false },
      { partNumber: "17220-5AA-A00", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Honda", model: "CR-V", year: 2021, engine: "1.5L L15B7 Turbo",
    oilCapacity: 3.7,
    filters: [
      { partNumber: "15400-5AA-A01", type: "oil", isPrimary: true },
      { partNumber: "15400-PLM-A01", type: "oil", isPrimary: false },
      { partNumber: "17220-5AA-A00", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Honda", model: "CR-V", year: 2023, engine: "1.5L L15BY Turbo",
    oilCapacity: 3.7,
    filters: [
      { partNumber: "15400-5AA-A01", type: "oil", isPrimary: true },
      { partNumber: "15400-PLM-A01", type: "oil", isPrimary: false },
      { partNumber: "17220-5AA-A00", type: "air", isPrimary: true },
    ]
  },

  // ===== FORD =====
  // Focus
  {
    make: "Ford", model: "Focus", year: 2020, engine: "1.5L EcoBoost",
    oilCapacity: 4.3,
    filters: [
      { partNumber: "FL-910-S", type: "oil", isPrimary: true, notes: "Ford OEM" },
      { partNumber: "FL-2062", type: "oil", isPrimary: false, notes: "Motorcraft" },
      { partNumber: "FA-1927", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Ford", model: "Focus", year: 2021, engine: "1.5L EcoBoost",
    oilCapacity: 4.3,
    filters: [
      { partNumber: "FL-910-S", type: "oil", isPrimary: true },
      { partNumber: "FL-2062", type: "oil", isPrimary: false },
      { partNumber: "FA-1927", type: "air", isPrimary: true },
    ]
  },
  // Edge
  {
    make: "Ford", model: "Edge", year: 2020, engine: "2.0L EcoBoost",
    oilCapacity: 5.4,
    filters: [
      { partNumber: "FL-910-S", type: "oil", isPrimary: true },
      { partNumber: "FL-2062", type: "oil", isPrimary: false },
      { partNumber: "FA-1927", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Ford", model: "Edge", year: 2021, engine: "2.0L EcoBoost",
    oilCapacity: 5.4,
    filters: [
      { partNumber: "FL-910-S", type: "oil", isPrimary: true },
      { partNumber: "FL-2062", type: "oil", isPrimary: false },
      { partNumber: "FA-1927", type: "air", isPrimary: true },
    ]
  },
  // Explorer
  {
    make: "Ford", model: "Explorer", year: 2021, engine: "2.3L EcoBoost I4",
    oilCapacity: 5.7,
    filters: [
      { partNumber: "FL-500-S", type: "oil", isPrimary: true, notes: "Explorer specific" },
      { partNumber: "FL-910-S", type: "oil", isPrimary: false },
      { partNumber: "FA-1927", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Ford", model: "Explorer", year: 2022, engine: "3.3L Hybrid V6",
    oilCapacity: 5.7,
    filters: [
      { partNumber: "FL-500-S", type: "oil", isPrimary: true },
      { partNumber: "FL-910-S", type: "oil", isPrimary: false },
      { partNumber: "FA-1927", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Ford", model: "Explorer", year: 2023, engine: "3.3L Hybrid V6",
    oilCapacity: 5.7,
    filters: [
      { partNumber: "FL-500-S", type: "oil", isPrimary: true },
      { partNumber: "FL-910-S", type: "oil", isPrimary: false },
      { partNumber: "FA-1927", type: "air", isPrimary: true },
    ]
  },

  // ===== HYUNDAI =====
  // Elantra
  {
    make: "Hyundai", model: "Elantra", year: 2021, engine: "2.0L Nu MPI",
    oilCapacity: 3.8,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true, notes: "Smartstream" },
      { partNumber: "26300-35504", type: "oil", isPrimary: false, notes: "Extended drain" },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Hyundai", model: "Elantra", year: 2022, engine: "2.0L Nu MPI",
    oilCapacity: 3.8,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Hyundai", model: "Elantra", year: 2023, engine: "2.0L Nu MPI",
    oilCapacity: 3.8,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  // Tucson
  {
    make: "Hyundai", model: "Tucson", year: 2021, engine: "2.5L Smartstream GDI",
    oilCapacity: 4.0,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Hyundai", model: "Tucson", year: 2022, engine: "2.5L Smartstream GDI",
    oilCapacity: 4.0,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Hyundai", model: "Tucson", year: 2023, engine: "1.6L T-GDi Hybrid",
    oilCapacity: 4.0,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  // Santa Fe
  {
    make: "Hyundai", model: "Santa Fe", year: 2021, engine: "2.5L Smartstream GDI",
    oilCapacity: 4.5,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Hyundai", model: "Santa Fe", year: 2022, engine: "2.5L Smartstream GDI",
    oilCapacity: 4.5,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },

  // ===== KIA =====
  // Cerato / Forte
  {
    make: "Kia", model: "Cerato", year: 2021, engine: "2.0L Nu MPI",
    oilCapacity: 3.8,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true, notes: "Same as Hyundai" },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Kia", model: "Cerato", year: 2022, engine: "2.0L Nu MPI",
    oilCapacity: 3.8,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  // Sportage
  {
    make: "Kia", model: "Sportage", year: 2021, engine: "2.4L Theta II GDI",
    oilCapacity: 4.5,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Kia", model: "Sportage", year: 2022, engine: "2.5L Smartstream GDI",
    oilCapacity: 4.5,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Kia", model: "Sportage", year: 2023, engine: "1.6L T-GDi Turbo",
    oilCapacity: 4.5,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  // Sorento
  {
    make: "Kia", model: "Sorento", year: 2021, engine: "3.5L Lambda II GDI V6",
    oilCapacity: 5.5,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true, notes: "V6 engine" },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Kia", model: "Sorento", year: 2022, engine: "2.5L Smartstream Turbo",
    oilCapacity: 5.2,
    filters: [
      { partNumber: "26300-35503", type: "oil", isPrimary: true },
      { partNumber: "26300-35504", type: "oil", isPrimary: false },
      { partNumber: "28113-L1000", type: "air", isPrimary: true },
    ]
  },

  // ===== CHEVROLET =====
  // Malibu
  {
    make: "Chevrolet", model: "Malibu", year: 2020, engine: "1.5L Turbo LFV",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "PF64E", type: "oil", isPrimary: true, notes: "ACDelco OEM" },
      { partNumber: "PF64", type: "oil", isPrimary: false, notes: "Standard" },
      { partNumber: "A3183C", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Chevrolet", model: "Malibu", year: 2021, engine: "1.5L Turbo LFV",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "PF64E", type: "oil", isPrimary: true },
      { partNumber: "PF64", type: "oil", isPrimary: false },
      { partNumber: "A3183C", type: "air", isPrimary: true },
    ]
  },
  // Tahoe
  {
    make: "Chevrolet", model: "Tahoe", year: 2021, engine: "5.3L EcoTec3 V8 L84",
    oilCapacity: 7.6,
    filters: [
      { partNumber: "PF48E", type: "oil", isPrimary: true, notes: "V8 engine" },
      { partNumber: "PF48", type: "oil", isPrimary: false },
      { partNumber: "A3183C", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Chevrolet", model: "Tahoe", year: 2022, engine: "5.3L EcoTec3 V8 L84",
    oilCapacity: 7.6,
    filters: [
      { partNumber: "PF48E", type: "oil", isPrimary: true },
      { partNumber: "PF48", type: "oil", isPrimary: false },
      { partNumber: "A3183C", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Chevrolet", model: "Tahoe", year: 2023, engine: "5.3L EcoTec3 V8 L84",
    oilCapacity: 7.6,
    filters: [
      { partNumber: "PF48E", type: "oil", isPrimary: true },
      { partNumber: "PF48", type: "oil", isPrimary: false },
      { partNumber: "A3183C", type: "air", isPrimary: true },
    ]
  },
  // Silverado
  {
    make: "Chevrolet", model: "Silverado", year: 2021, engine: "5.3L EcoTec3 V8 L84",
    oilCapacity: 7.6,
    filters: [
      { partNumber: "PF48E", type: "oil", isPrimary: true },
      { partNumber: "PF48", type: "oil", isPrimary: false },
      { partNumber: "A3183C", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Chevrolet", model: "Silverado", year: 2022, engine: "5.3L EcoTec3 V8 L84",
    oilCapacity: 7.6,
    filters: [
      { partNumber: "PF48E", type: "oil", isPrimary: true },
      { partNumber: "PF48", type: "oil", isPrimary: false },
      { partNumber: "A3183C", type: "air", isPrimary: true },
    ]
  },

  // ===== MITSUBISHI =====
  // L200
  {
    make: "Mitsubishi", model: "L200", year: 2021, engine: "2.4L 4N15 Diesel MIVEC",
    oilCapacity: 5.3,
    filters: [
      { partNumber: "MZ690098", type: "oil", isPrimary: true, notes: "Diesel engine" },
      { partNumber: "15009-09400", type: "oil", isPrimary: false },
      { partNumber: "1370A03400", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Mitsubishi", model: "L200", year: 2022, engine: "2.4L 4N15 Diesel MIVEC",
    oilCapacity: 5.3,
    filters: [
      { partNumber: "MZ690098", type: "oil", isPrimary: true },
      { partNumber: "15009-09400", type: "oil", isPrimary: false },
      { partNumber: "1370A03400", type: "air", isPrimary: true },
    ]
  },
  // Pajero
  {
    make: "Mitsubishi", model: "Pajero", year: 2020, engine: "3.2L 4M41 Diesel DI-D",
    oilCapacity: 6.5,
    filters: [
      { partNumber: "MZ690098", type: "oil", isPrimary: true },
      { partNumber: "15009-09400", type: "oil", isPrimary: false },
      { partNumber: "1370A03400", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Mitsubishi", model: "Pajero", year: 2021, engine: "3.2L 4M41 Diesel DI-D",
    oilCapacity: 6.5,
    filters: [
      { partNumber: "MZ690098", type: "oil", isPrimary: true },
      { partNumber: "15009-09400", type: "oil", isPrimary: false },
      { partNumber: "1370A03400", type: "air", isPrimary: true },
    ]
  },

  // ===== MAZDA =====
  // CX-5
  {
    make: "Mazda", model: "CX-5", year: 2021, engine: "2.5L SkyActiv-G",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "PE01-14-302", type: "oil", isPrimary: true, notes: "SkyActiv" },
      { partNumber: "PE01-14-302A", type: "oil", isPrimary: false, notes: "Extended life" },
      { partNumber: "PE07-13-J81", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Mazda", model: "CX-5", year: 2022, engine: "2.5L SkyActiv-G Turbo",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "PE01-14-302", type: "oil", isPrimary: true },
      { partNumber: "PE01-14-302A", type: "oil", isPrimary: false },
      { partNumber: "PE07-13-J81", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Mazda", model: "CX-5", year: 2023, engine: "2.5L SkyActiv-G Turbo",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "PE01-14-302", type: "oil", isPrimary: true },
      { partNumber: "PE01-14-302A", type: "oil", isPrimary: false },
      { partNumber: "PE07-13-J81", type: "air", isPrimary: true },
    ]
  },
  // Mazda 6
  {
    make: "Mazda", model: "Mazda6", year: 2020, engine: "2.5L SkyActiv-G",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "PE01-14-302", type: "oil", isPrimary: true },
      { partNumber: "PE01-14-302A", type: "oil", isPrimary: false },
      { partNumber: "PE07-13-J81", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Mazda", model: "Mazda6", year: 2021, engine: "2.5L SkyActiv-G Turbo",
    oilCapacity: 4.8,
    filters: [
      { partNumber: "PE01-14-302", type: "oil", isPrimary: true },
      { partNumber: "PE01-14-302A", type: "oil", isPrimary: false },
      { partNumber: "PE07-13-J81", type: "air", isPrimary: true },
    ]
  },

  // ===== MG =====
  // MG ZS
  {
    make: "MG", model: "ZS", year: 2021, engine: "1.5L 15S4C",
    oilCapacity: 3.7,
    filters: [
      { partNumber: "10089590", type: "oil", isPrimary: true, notes: "MG SAIC" },
      { partNumber: "10089591", type: "oil", isPrimary: false },
      { partNumber: "10092579", type: "air", isPrimary: true },
    ]
  },
  {
    make: "MG", model: "ZS", year: 2022, engine: "1.5L 15S4C",
    oilCapacity: 3.7,
    filters: [
      { partNumber: "10089590", type: "oil", isPrimary: true },
      { partNumber: "10089591", type: "oil", isPrimary: false },
      { partNumber: "10092579", type: "air", isPrimary: true },
    ]
  },
  // MG HS
  {
    make: "MG", model: "HS", year: 2021, engine: "1.5L 15E4E Turbo",
    oilCapacity: 4.0,
    filters: [
      { partNumber: "10089590", type: "oil", isPrimary: true },
      { partNumber: "10089591", type: "oil", isPrimary: false },
      { partNumber: "10092579", type: "air", isPrimary: true },
    ]
  },
  {
    make: "MG", model: "HS", year: 2022, engine: "1.5L 15E4E Turbo",
    oilCapacity: 4.0,
    filters: [
      { partNumber: "10089590", type: "oil", isPrimary: true },
      { partNumber: "10089591", type: "oil", isPrimary: false },
      { partNumber: "10092579", type: "air", isPrimary: true },
    ]
  },

  // ===== GAC =====
  // GAC GS4
  {
    make: "GAC", model: "GS4", year: 2021, engine: "1.5L 4A15J1 Turbo",
    oilCapacity: 4.0,
    filters: [
      { partNumber: "3612000AAH0300", type: "oil", isPrimary: true, notes: "GAC OEM" },
      { partNumber: "3612000AAH0301", type: "oil", isPrimary: false },
      { partNumber: "3722000AAH0300", type: "air", isPrimary: true },
    ]
  },
  {
    make: "GAC", model: "GS4", year: 2022, engine: "1.5L 4A15J1 Turbo",
    oilCapacity: 4.0,
    filters: [
      { partNumber: "3612000AAH0300", type: "oil", isPrimary: true },
      { partNumber: "3612000AAH0301", type: "oil", isPrimary: false },
      { partNumber: "3722000AAH0300", type: "air", isPrimary: true },
    ]
  },

  // ===== GEELY =====
  // Geely Emgrand
  {
    make: "Geely", model: "Emgrand", year: 2022, engine: "1.5L JLH-3G15TD",
    oilCapacity: 3.8,
    filters: [
      { partNumber: "304700-XXXXX", type: "oil", isPrimary: true, notes: "Geely OEM" },
      { partNumber: "304700-XXXXY", type: "oil", isPrimary: false },
      { partNumber: "354300-XXXXX", type: "air", isPrimary: true },
    ]
  },
  {
    make: "Geely", model: "Emgrand", year: 2023, engine: "1.5L JLH-3G15TD",
    oilCapacity: 3.8,
    filters: [
      { partNumber: "304700-XXXXX", type: "oil", isPrimary: true },
      { partNumber: "304700-XXXXY", type: "oil", isPrimary: false },
      { partNumber: "354300-XXXXX", type: "air", isPrimary: true },
    ]
  },
];

async function main() {
  console.log("Starting vehicle data seeding...");
  console.log(`Total vehicle entries: ${vehicleData.length}`);

  // Check if vehicles table exists
  const tableCheck = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicles'
    ) as exists
  `;

  if (!tableCheck[0].exists) {
    console.log("Creating vehicles table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.vehicles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        engine TEXT NOT NULL,
        oil_capacity NUMERIC(4,1) NOT NULL,
        oil_filter_part_number TEXT,
        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(make, model, year, engine)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON public.vehicles(make, model)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vehicles_year ON public.vehicles(year)`;
    await sql`ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY`;
    await sql`CREATE POLICY "Allow all operations for authenticated users" ON public.vehicles FOR ALL USING (auth.role() = 'authenticated')`;
  }

  // Check if vehicle_filters table exists
  const filtersTableCheck = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicle_filters'
    ) as exists
  `;

  if (!filtersTableCheck[0].exists) {
    console.log("Creating vehicle_filters table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.vehicle_filters (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
        filter_part_number TEXT NOT NULL,
        filter_type TEXT DEFAULT 'oil',
        is_primary BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
        CONSTRAINT vehicle_filters_unique UNIQUE(vehicle_id, filter_part_number)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_vehicle_filters_vehicle_id ON public.vehicle_filters(vehicle_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vehicle_filters_part_number ON public.vehicle_filters(filter_part_number)`;
    await sql`ALTER TABLE public.vehicle_filters ENABLE ROW LEVEL SECURITY`;
    await sql`CREATE POLICY "Allow all operations for authenticated users" ON public.vehicle_filters FOR ALL USING (auth.role() = 'authenticated')`;
  }

  // Clear existing data
  console.log("Clearing existing vehicle data...");
  await sql`DELETE FROM vehicle_filters`;
  await sql`DELETE FROM vehicles`;

  let vehicleCount = 0;
  let filterCount = 0;

  // Insert vehicle data
  for (const entry of vehicleData) {
    // Insert vehicle
    const [vehicle] = await sql`
      INSERT INTO vehicles (make, model, year, engine, oil_capacity)
      VALUES (${entry.make}, ${entry.model}, ${entry.year}, ${entry.engine}, ${entry.oilCapacity})
      RETURNING id
    `;

    if (!vehicle) {
      console.error(`Failed to insert vehicle: ${entry.make} ${entry.model} ${entry.year}`);
      continue;
    }

    vehicleCount++;

    // Insert filters for this vehicle
    for (const filter of entry.filters) {
      await sql`
        INSERT INTO vehicle_filters (vehicle_id, filter_part_number, filter_type, is_primary, notes)
        VALUES (${vehicle.id}, ${filter.partNumber}, ${filter.type}, ${filter.isPrimary}, ${filter.notes || null})
      `;
      filterCount++;
    }
  }

  console.log(`\nSeeding complete!`);
  console.log(`Vehicles inserted: ${vehicleCount}`);
  console.log(`Filters inserted: ${filterCount}`);

  // Summary by make
  const makeSummary = await sql`
    SELECT make, COUNT(*) as count 
    FROM vehicles 
    GROUP BY make 
    ORDER BY count DESC
  `;
  console.log("\nVehicles by Make:");
  for (const row of makeSummary) {
    console.log(`  ${row.make}: ${row.count}`);
  }

  await sql.end();
}

main().catch((e) => {
  console.error("Error seeding vehicle data:", e);
  process.exit(1);
});
