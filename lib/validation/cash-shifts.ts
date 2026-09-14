import { z } from "zod";

const denominationBreakdownSchema = z
  .object({
    fiftyNote: z.number().int().min(0).optional(),
    twentyNote: z.number().int().min(0).optional(),
    tenNote: z.number().int().min(0).optional(),
    fiveNote: z.number().int().min(0).optional(),
    oneNote: z.number().int().min(0).optional(),
    halfNote: z.number().int().min(0).optional(),
    hundredBaisa: z.number().int().min(0).optional(),
    coins: z.number().min(0).optional(),
  })
  .strict()
  .optional();

export const openShiftInputSchema = z.object({
  shopId: z.string().min(1, "shopId is required"),
  locationId: z.string().min(1, "locationId is required"),
  openedByStaffId: z.string().min(1, "openedByStaffId is required"),
  openingCash: z.number().finite().min(0, "openingCash cannot be negative"),
  openingDenominations: denominationBreakdownSchema,
  openingNotes: z.string().max(500).optional(),
});

export type OpenShiftInputValidated = z.infer<typeof openShiftInputSchema>;
