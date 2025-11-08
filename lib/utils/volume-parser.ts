/**
 * Volume Parsing Utilities
 * 
 * Functions to parse volume strings and extract numeric values
 * Handles formats like "1L", "4L", "500ml", "20L", etc.
 */

/**
 * Parses a volume string and returns the numeric value in liters
 * 
 * @param volumeStr - Volume string (e.g., "1L", "4L", "500ml", "20L")
 * @returns Numeric value in liters (e.g., "1L" → 1.0, "500ml" → 0.5)
 */
export function parseVolumeString(volumeStr: string): number {
  if (!volumeStr || typeof volumeStr !== "string") {
    return 0;
  }

  // Remove all non-digit and non-decimal characters, but keep the decimal point
  const cleaned = volumeStr.trim().toLowerCase();
  
  // Handle milliliters (ml)
  if (cleaned.includes("ml")) {
    const mlMatch = cleaned.match(/(\d+\.?\d*)\s*ml/);
    if (mlMatch) {
      const mlValue = parseFloat(mlMatch[1]);
      return mlValue / 1000; // Convert ml to liters
    }
  }
  
  // Handle liters (L)
  if (cleaned.includes("l")) {
    const lMatch = cleaned.match(/(\d+\.?\d*)\s*l/);
    if (lMatch) {
      return parseFloat(lMatch[1]);
    }
  }
  
  // Fallback: try to extract any number
  const numberMatch = cleaned.match(/(\d+\.?\d*)/);
  if (numberMatch) {
    return parseFloat(numberMatch[1]);
  }
  
  return 0;
}

/**
 * Finds the highest volume from an array of volume objects
 * 
 * @param volumes - Array of volume objects with size property
 * @returns The volume string with the highest numeric value (e.g., "4L" or "5L")
 */
export function findHighestVolumeFromVolumes(
  volumes: Array<{ size: string; [key: string]: any }>
): string | null {
  if (!volumes || volumes.length === 0) {
    return null;
  }

  let highestVolume: { size: string; value: number } | null = null;

  for (const volume of volumes) {
    const numericValue = parseVolumeString(volume.size);
    if (
      !highestVolume ||
      numericValue > highestVolume.value ||
      (numericValue === highestVolume.value &&
        volume.size.length < highestVolume.size.length)
    ) {
      highestVolume = { size: volume.size, value: numericValue };
    }
  }

  return highestVolume?.size || null;
}

/**
 * Checks if a volume string represents the highest volume
 * 
 * @param volumeSize - Volume string to check (e.g., "4L")
 * @param volumes - Array of all volume objects
 * @returns True if the volume is the highest volume
 */
export function isHighestVolume(
  volumeSize: string,
  volumes: Array<{ size: string; [key: string]: any }>
): boolean {
  const highest = findHighestVolumeFromVolumes(volumes);
  return highest === volumeSize;
}

