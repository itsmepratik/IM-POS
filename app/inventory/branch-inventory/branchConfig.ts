/**
 * Branch shop configuration with actual database IDs.
 * Source of truth for branch inventory management.
 */

export const BRANCH_SHOPS = {
  ABU_DHURUS: {
    id: "4beefe72-ff91-48e8-a2b6-c933904a1f26",
    name: "Abu Dhurus",
    displayName: "Abu Dhurus",
    locationId: "d2f3b51b-2e86-4c4b-831c-96b468bd48db",
  },
  HAFITH: {
    id: "165cb8b9-0742-4eee-9d1d-1ab400a11a8b",
    name: "Hafith",
    displayName: "Hafith",
    locationId: "93922a5e-5327-4561-8395-97a4653c720c",
  },
} as const;

export type BranchShopKey = keyof typeof BRANCH_SHOPS;
export type BranchShop = (typeof BRANCH_SHOPS)[BranchShopKey];

/** Get branch shop by location ID */
export const getBranchByLocationId = (locationId: string): BranchShop | undefined => {
  return Object.values(BRANCH_SHOPS).find((shop) => shop.locationId === locationId);
};

/** Get all branch shops as an array for dropdowns */
export const getAllBranchShops = (): BranchShop[] => Object.values(BRANCH_SHOPS);

/** Default branch for initial load */
export const DEFAULT_BRANCH = BRANCH_SHOPS.ABU_DHURUS;
