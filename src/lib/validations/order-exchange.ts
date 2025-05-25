import { z } from "zod";

export const exchangeShipmentSchema = z.object({
  deliveredOrderId: z.string(),
  returnedOrderId: z.string().uuid(),
  exchangeOrderId: z.string(),
  srOrderId: z.number().optional(),
  srShipmentId: z.number().optional(),
  status: z.string().optional(),
  awb: z.number().optional(),
  courierCompanyName: z.string().optional(),
  srResponse: z.record(z.any()).optional(),
});

export type exchangeShipment = z.infer<typeof exchangeShipmentSchema>;
