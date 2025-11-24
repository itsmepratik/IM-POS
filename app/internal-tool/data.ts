// Mock data structure - replace with real API integration later
export const carData = {
  Toyota: {
    Camry: {
      2020: { "2.5L": 4.7, "3.5L": 6.4 },
      2021: { "2.5L": 4.7, "3.5L": 6.4 },
      2022: { "2.5L": 4.7, "3.5L": 6.4 },
    },
    Corolla: {
      2020: { "1.8L": 4.4, "2.0L": 4.4 },
      2021: { "1.8L": 4.4, "2.0L": 4.4 },
      2022: { "1.8L": 4.4, "2.0L": 4.4 },
    },
  },
  Honda: {
    Accord: {
      2020: { "1.5L Turbo": 4.4, "2.0L Turbo": 5.7 },
      2021: { "1.5L Turbo": 4.4, "2.0L Turbo": 5.7 },
      2022: { "1.5L Turbo": 4.4, "2.0L Turbo": 5.7 },
    },
    Civic: {
      2020: { "1.5L": 3.7, "2.0L": 4.4 },
      2021: { "1.5L": 3.7, "2.0L": 4.4 },
      2022: { "1.5L": 3.7, "2.0L": 4.4 },
    },
  },
  BMW: {
    "3 Series": {
      2020: { "2.0L": 5.2, "3.0L": 6.5 },
      2021: { "2.0L": 5.2, "3.0L": 6.5 },
      2022: { "2.0L": 5.2, "3.0L": 6.5 },
    },
    "5 Series": {
      2020: { "2.0L": 5.5, "3.0L": 6.5 },
      2021: { "2.0L": 5.5, "3.0L": 6.5 },
      2022: { "2.0L": 5.5, "3.0L": 6.5 },
    },
  },
};

export const lubricants = [
  { name: "Synthetic 5W-30", pricePerLiter: 12.5, type: "Full Synthetic" },
  { name: "Synthetic 0W-20", pricePerLiter: 13.0, type: "Full Synthetic" },
  { name: "Conventional 10W-30", pricePerLiter: 8.5, type: "Conventional" },
  { name: "Semi-Synthetic 5W-30", pricePerLiter: 10.0, type: "Semi-Synthetic" },
  { name: "High Mileage 5W-30", pricePerLiter: 11.5, type: "High Mileage" },
];

// Mock oil filter data - replace with real data later
export const oilFilters = {
  Toyota: {
    Camry: {
      2020: { "2.5L": "90915-YZZF2", "3.5L": "04152-YZZA6" },
      2021: { "2.5L": "90915-YZZF2", "3.5L": "04152-YZZA6" },
      2022: { "2.5L": "90915-YZZF2", "3.5L": "04152-YZZA6" },
    },
    Corolla: {
      2020: { "1.8L": "90915-YZZF2", "2.0L": "90915-YZZF2" },
      2021: { "1.8L": "90915-YZZF2", "2.0L": "90915-YZZF2" },
      2022: { "1.8L": "90915-YZZF2", "2.0L": "90915-YZZF2" },
    },
  },
  Honda: {
    Accord: {
      2020: { "1.5L Turbo": "15400-RTA-003", "2.0L Turbo": "15400-RTA-004" },
      2021: { "1.5L Turbo": "15400-RTA-003", "2.0L Turbo": "15400-RTA-004" },
      2022: { "1.5L Turbo": "15400-RTA-003", "2.0L Turbo": "15400-RTA-004" },
    },
    Civic: {
      2020: { "1.5L": "15400-RTA-003", "2.0L": "15400-RTA-003" },
      2021: { "1.5L": "15400-RTA-003", "2.0L": "15400-RTA-003" },
      2022: { "1.5L": "15400-RTA-003", "2.0L": "15400-RTA-003" },
    },
  },
  BMW: {
    "3 Series": {
      2020: { "2.0L": "11427953129", "3.0L": "11427953129" },
      2021: { "2.0L": "11427953129", "3.0L": "11427953129" },
      2022: { "2.0L": "11427953129", "3.0L": "11427953129" },
    },
    "5 Series": {
      2020: { "2.0L": "11427953129", "3.0L": "11427953129" },
      2021: { "2.0L": "11427953129", "3.0L": "11427953129" },
      2022: { "2.0L": "11427953129", "3.0L": "11427953129" },
    },
  },
};

export const filterPricing = {
  none: { multiplier: 0, label: "No Filter" },
  oem: { multiplier: 1.0, label: "OEM (Original)" },
  firstCopy: { multiplier: 0.65, label: "First Copy" },
  secondCopy: { multiplier: 0.40, label: "Second Copy" },
};

export const baseFilterPrice = 25.0; // Base price for OEM filter
