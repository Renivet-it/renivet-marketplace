import { z } from "zod";

export const returnShipmentSchema = z.object({
  deliveredOrderId: z.string(),
  returnOrderId: z.string(),
  srOrderId: z.number().optional(),
  srShipmentId: z.number().optional(),
  status: z.string().optional(),
  rtoExchangeType: z.boolean().optional(),
  awb: z.number().optional(),
  courierCompanyName: z.string().optional(),
  srResponse: z.record(z.any()).optional(),
});

export type returnShipment = z.infer<typeof returnShipmentSchema>;