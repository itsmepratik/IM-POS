// Mock data structure - replace with real API integration later
// Mock data structure - replace with real API integration later

export const lubricants = [
  { name: "Synthetic 5W-30", pricePerLiter: 12.5, type: "Full Synthetic" },
  { name: "Synthetic 0W-20", pricePerLiter: 13.0, type: "Full Synthetic" },
  { name: "Conventional 10W-30", pricePerLiter: 8.5, type: "Conventional" },
  { name: "Semi-Synthetic 5W-30", pricePerLiter: 10.0, type: "Semi-Synthetic" },
  { name: "High Mileage 5W-30", pricePerLiter: 11.5, type: "High Mileage" },
];

export const filterPricing = {
  none: { multiplier: 0, label: "No Filter" },
  oem: { multiplier: 1.0, label: "OEM (Original)" },
  firstCopy: { multiplier: 0.65, label: "First Copy" },
  secondCopy: { multiplier: 0.40, label: "Second Copy" },
};

export const baseFilterPrice = 25.0; // Base price for OEM filter
