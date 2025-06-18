import { z } from "zod";

export const orderReturnShiprocketResponse = z.object({
  order_id: z.number().int(),
  shipment_id: z.number().int(),
  status: z.string(), // Optionally you can use z.enum() if status values are fixed
  status_code: z.number().int(),
  company_name: z.string()
});

export type OrderReturnShiprockResponse = z.infer<typeof orderReturnShiprocketResponse>;