import { z } from "zod";
import { eq, and, like, sql } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { orderReturnRequests, orders, orderItems, users } from "@/lib/db/schema";
import { generatePickupLocationCode } from "@/lib/utils";
import Razorpay from "razorpay";

export const returnReplaceRouter = createTRPCRouter({

    // -------------------------------------------------------
    // 1️⃣ CREATE RETURN / REPLACE REQUEST t
    // -------------------------------------------------------
    create: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
                orderItemId: z.string(),
                brandId: z.string(),
                requestType: z.enum(["return", "replace"]),
                newVariantId: z.string().optional(),
                reason: z.string().optional(),
                comment: z.string().optional(),
                images: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db.insert(orderReturnRequests).values({
                id: crypto.randomUUID(),
                ...input,
                status: "pending",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return { success: true };
        }),

    // -------------------------------------------------------
    // 2️⃣ GET REQUESTS (WITH PAGINATION + SEARCH)
    // -------------------------------------------------------
    getRequests: protectedProcedure
        .input(
            z.object({
                page: z.number().default(1),
                limit: z.number().default(10),
                search: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, limit, search } = input;

            const offset = (page - 1) * limit;

            // --------------------------------------------
            // 🔍 Search by orderId
            // --------------------------------------------
            const searchFilter = search
                ? like(orderReturnRequests.orderId, `%${search}%`)
                : undefined;

            // --------------------------------------------
            // 1️⃣ Count total rows
            // --------------------------------------------
            const [countRow] = await ctx.db
                .select({ count: sql<number>`count(*)` })
                .from(orderReturnRequests)
                .where(searchFilter);

            const total = Number(countRow?.count ?? 0);

            // --------------------------------------------
            // 2️⃣ Fetch paginated rows + relations
            // --------------------------------------------
            const rows = await ctx.db.query.orderReturnRequests.findMany({
                limit,
                offset,
                where: (r, { and }) => and(searchFilter),
                with: {
          order: {
            with: {
                user: true, // ⭐ NOW WORKS!
            },
        },
                    orderItem: {
                        with: {
                            product: true,
                            variant: true,
                        },
                    },
                    // user: true,
                },
                orderBy: (r, { desc }) => desc(r.createdAt),
            });
            // --------------------------------------------
            // 3️⃣ Convert to the format your table expects
            // --------------------------------------------
            const data = rows.map((r) => ({
                id: r.id,
                orderId: r.orderId,
                orderItemId: r.orderItemId,
                requestType: r.requestType,
                newVariantId: r.newVariantId,
                reason: r.reason,
                comment: r.comment,
                status: r.status,
                brandId: r.brandId,
                images: r.images,
                user: {
                    firstName: r.order.user.firstName,
                    lastName: r.order.user.lastName,
                },

                createdAt: r.createdAt,
            }));

            return {
                data,
                count: total,
            };
        }),

    // -------------------------------------------------------
    // 3️⃣ APPROVE REQUEST
    // -------------------------------------------------------
    approveRequest: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .update(orderReturnRequests)
                .set({
                    status: "approved",
                    updatedAt: new Date(),
                })
                .where(eq(orderReturnRequests.id, input.id));

            return { success: true };
        }),

    // -------------------------------------------------------
    // 4️⃣ REJECT REQUEST
    // -------------------------------------------------------
    rejectRequest: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                comment: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .update(orderReturnRequests)
                .set({
                    status: "rejected",
                    comment: input.comment ?? null,
                    updatedAt: new Date(),
                })
                .where(eq(orderReturnRequests.id, input.id));

            return { success: true };
        }),

    // -------------------------------------------------------
    // 5️⃣ MARK COMPLETED
    // -------------------------------------------------------
    markCompleted: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .update(orderReturnRequests)
                .set({
                    status: "completed",
                    updatedAt: new Date(),
                })
                .where(eq(orderReturnRequests.id, input.id));

            return { success: true };
        }),

           // -------------------------------------------------------
//     // 5️⃣ SEPARATE — CREATE DELHIVERY RTO (Return)
//     // -------------------------------------------------------
// createRTOShipment: protectedProcedure
//   .input(z.object({ requestId: z.string() }))
//   .mutation(async ({ ctx, input }) => {
//     // Fetch the return request with user + order + brand confidential data
//     const request = await ctx.db.query.orderReturnRequests.findFirst({
//       where: (r, { eq }) => eq(r.id, input.requestId),
//       with: {
//         order: { with: { address: true, user: true } },
//         orderItem: {
//           with: {
//             product: {
//               with: {
//                 brand: {
//                   with: {
//                     confidential: true,
//                   }
//                 }
//               }
//             },
//             variant: true,
//           },
//         },
//       },
//     });

//     if (!request) throw new Error("Request not found");
//     if (request.requestType !== "return")
//       throw new Error("Not a return request");
// console.log(request, "request");
//     const customer = request.order;
//     const brandConf = request.orderItem.product.brand.confidential;

//     if (!brandConf) throw new Error("Brand confidential address missing");

//     // 🚚 BUILD DELHIVERY RVP PAYLOAD (RTO)
//     const shipment = {
//       // pickup from customer
//       name: customer.user.firstName + " " + customer.user.lastName,
//       add: customer.address.street,
//       pin: String(customer.address.zip),
//       city: customer.address.city,
//       state: customer.address.state,
//       country: "India",
//       phone: [customer.user.phone],

//       order: request.orderId,
//       payment_mode: "Pickup", // RVP mode

//       // deliver to warehouse
//       return_name: brandConf.contactName ?? brandConf.companyName,
//       return_address: brandConf.addressLine1,
//       return_pin: String(brandConf.postalCode),
//       return_city: brandConf.city,
//       return_state: brandConf.state,
//       return_country: "India",
//       return_phone: [brandConf.phone],

//       quantity: String(request.orderItem.quantity ?? 1),

//       shipping_mode: "Surface",
//       address_type: "home",
//     };
// const pickupLocation = generatePickupLocationCode({
//     brandId: request.orderItem.product.brand.id ?? "",
//     brandName: request.orderItem.product.brand.name ?? "",
// });
//     // Full payload wrapper
//     const payload = {
//       format: "json",
//       data: {
//         shipments: [shipment],
//         pickup_location: {
//           name: pickupLocation, // must match Delhivery panel
//         },
//       },
//     };

//     console.log("RTO Payload:", JSON.stringify(payload, null, 2));

//     // Send request
//     const resp = await fetch(
//       "https://track.delhivery.com/api/cmu/create.json",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: "Token " + process.env.DELHIVERY_TOKEN!,
//         },
//         body: JSON.stringify(payload),
//       }
//     );

//     const data = await resp.json();
//       console.log("📩 Delhivery REPL Raw Response →", data);

//     // Save response in DB
//     await ctx.db.update(orderReturnRequests)
//       .set({
//         status: "processing",
//         updatedAt: new Date(),
//       })
//       .where(eq(orderReturnRequests.id, request.id));

//     return { success: true, data };
//   }),

// 5️⃣ SEPARATE — CREATE DELHIVERY RTO (Return)
createRTOShipment: protectedProcedure
  .input(z.object({ requestId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Fetch the return request
    const request = await ctx.db.query.orderReturnRequests.findFirst({
      where: (r, { eq }) => eq(r.id, input.requestId),
      with: {
        order: { with: { address: true, user: true } },
        orderItem: {
          with: {
            product: {
              with: {
                brand: { with: { confidential: true } }
              }
            },
            variant: true,
          },
        },
      },
    });

    if (!request) throw new Error("Request not found");
    if (request.requestType !== "return")
      throw new Error("Not a return request");

    const customer = request.order;
    const brandConf = request.orderItem.product.brand.confidential;
    if (!brandConf) throw new Error("Brand confidential address missing");

    // 🚚 Build Shipment
    const shipment = {
      name: customer.user.firstName + " " + customer.user.lastName,
      add: customer.address.street,
      pin: String(customer.address.zip),
      city: customer.address.city,
      state: customer.address.state,
      country: "India",
      phone: [customer.user.phone],

      order: request.orderId,
      payment_mode: "Pickup",

      return_name: brandConf.contactName ?? brandConf.companyName,
      return_address: brandConf.addressLine1,
      return_pin: String(brandConf.postalCode),
      return_city: brandConf.city,
      return_state: brandConf.state,
      return_country: "India",
      return_phone: [brandConf.phone],

      quantity: String(request.orderItem.quantity ?? 1),
      shipping_mode: "Surface",
      address_type: "home",
    };

    const pickupLocation = generatePickupLocationCode({
      brandId: request.orderItem.product.brand.id ?? "",
      brandName: request.orderItem.product.brand.name ?? "",
    });

    // 🔄 Must be a plain payload for `data`
    const dataPayload = {
      shipments: [shipment],
      pickup_location: { name: pickupLocation },
    };

    console.log("🟦 FINAL RTO DATA PAYLOAD →", dataPayload);

    // 📌 This is what Delhivery requires
    const formData = new URLSearchParams();
    formData.append("format", "json");
    formData.append("data", JSON.stringify(dataPayload));

    // 🔥 Send to Delhivery RVP API
    const resp = await fetch("https://track.delhivery.com/api/cmu/create.json", {
      method: "POST",
      headers: {
        Authorization: "Token " + process.env.DELHIVERY_TOKEN!,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString(),
    });

    const delhiveryResponse = await resp.json();
    console.log("📩 Delhivery RTO Raw Response →", delhiveryResponse);

   // ⭐ If Delhivery success → initiate Razorpay full refund
    const paymentId = customer.paymentId; // must exist in your orders table

    if (!paymentId) {
      console.error("❌ No paymentId found for refund");
    } else {
      console.log("💰 Initiating full refund for payment:", paymentId);

      const razorpay = new Razorpay({
        key_id: process.env.RAZOR_PAY_KEY_ID!,
        key_secret: process.env.RAZOR_PAY_SECRET_KEY!,
      });

       const refund = razorpay.payments.refund(customer.paymentId, {
         amount: customer.totalAmount, // convert to paise
       });
      console.log("💰 Razorpay Refund Response →", refund);

      // Optional: store refund ID in DB
      // await ctx.db.update(orders).set({
      //   refundId: refund.id,
      //   refundStatus: refund.status,
      // }).where(eq(orders.id, customer.id));
    }

    // Save in DB
    await ctx.db
      .update(orderReturnRequests)
      .set({
        status: "processing",
        updatedAt: new Date(),
      })
      .where(eq(orderReturnRequests.id, request.id));

    return { success: true, delhivery: delhiveryResponse };
  }),



createReplShipment: protectedProcedure
  .input(z.object({ requestId: z.string() }))
  .mutation(async ({ ctx, input }) => {

    // Fetch request with relations
    const request = await ctx.db.query.orderReturnRequests.findFirst({
      where: (r, { eq }) => eq(r.id, input.requestId),
      with: {
        order: { with: { address: true, user: true } },
        orderItem: {
          with: {
            product: {
              with: {
                brand: {
                  with: { confidential: true }
                }
              }
            },
            variant: true,
          },
        },
      },
    });
const newVariant = await ctx.db.query.productVariants.findFirst({
  where: (v, { eq }) => eq(v.id, request.newVariantId),
  with: {
    product: true,
  },
});
    if (!request) throw new Error("Request not found");
    if (request.requestType !== "replace")
      throw new Error("Not a replace request");

    if (!request.newVariantId) throw new Error("New variant ID is required for replace request");

    const customer = request.order;
    const product = request.orderItem.product;
    const brandConf = product.brand.confidential;

    if (!brandConf) throw new Error("Brand confidential missing");

    // -----------------------------------------------------------
    // Generate pickup location
    // -----------------------------------------------------------
    const pickupLocationName = generatePickupLocationCode({
      brandId: product.brand.id,
      brandName: product.brand.name,
    });
const newProductTitle = newVariant?.product.title;
const newVariantSize = newVariant?.sku || "Default Size";
    // -----------------------------------------------------------
    // Build DELHIVERY REPLACE payload
    // -----------------------------------------------------------
    const shipment = {
      name: customer.user.firstName + " " + customer.user.lastName,
      order: request.orderId,
      phone: [customer.user.phone],
      add: customer.address.street,
      pin: String(customer.address.zip),
      city: customer.address.city,
      state: customer.address.state,
      country: "India",

      payment_mode: "REPL", // ⭐ REQUIRED for Replace
      product_details: `${newProductTitle} - Size ${newVariantSize}`,
      return_product_details: product.title ?? `Returning ${product.title}`,
      quantity: String(request.orderItem.quantity ?? 1),

      return_address: brandConf.addressLine1,
      return_city: brandConf.city,
      return_state: brandConf.state,
      return_pin: String(brandConf.postalCode),
      return_country: "India",
      return_phone: [brandConf.phone],

      shipping_mode: "Surface",
      address_type: "home",
    };

    // This is the real payload Delhivery accepts
    const dataPayload = {
      shipments: [shipment],
      pickup_location: {
        name: pickupLocationName,
      },
    };

    console.log("REPL DATA PAYLOAD →", dataPayload);

    // -----------------------------------------------------------
    // ❗ FIX: Delhivery REQUIRES x-www-form-urlencoded
    // -----------------------------------------------------------
    const formData = new URLSearchParams();
    formData.append("format", "json");
    formData.append("data", JSON.stringify(dataPayload));

    // -----------------------------------------------------------
    // SEND TO DELHIVERY
    // -----------------------------------------------------------
    const resp = await fetch("https://track.delhivery.com/api/cmu/create.json", {
      method: "POST",
      headers: {
        Authorization: "Token " + process.env.DELHIVERY_TOKEN!,
        "Content-Type": "application/x-www-form-urlencoded", // ⭐ REQUIRED
      },
      body: formData.toString(), // ⭐ REQUIRED
    });

    const delhiveryResponse = await resp.json();
    console.log("📦 Delhivery REPL Raw Response →", delhiveryResponse);

    if (!resp.ok || delhiveryResponse.error) {
      throw new Error(`Delhivery REPL failed → ${JSON.stringify(delhiveryResponse)}`);
    }

    // Update status
    await ctx.db
      .update(orderReturnRequests)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(orderReturnRequests.id, request.id));

    return { success: true, data: delhiveryResponse };
  }),






//   trackShipment: protectedProcedure
//   .input(z.object({ awb: z.string() }))
//   .query(async ({ input }) => {
//     const resp = await fetch(
//       `https://track.delhivery.com/api/v1/packages/json/?waybill=${input.awb}`,
//       {
//         headers: {
//           Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
//         },
//       }
//     );

//     const data = await resp.json();
// console.log(data.ShipmentData[0]?.Shipment.Scans, "resposne");
//     const scans = data?.ShipmentData?.[0]?.Shipment?.ShipmentScan || [];

//     return scans.map((scan: { Scan: any; ScanDetail: any; ScanDateTime: any; }) => ({
//       status: scan.Scan,
//       detail: scan.ScanDetail,
//       time: scan.ScanDateTime,
//     }));
//   }),


trackShipment: protectedProcedure
  .input(z.object({ awb: z.string() }))
  .query(async ({ input }) => {
    const resp = await fetch(
      `https://track.delhivery.com/api/v1/packages/json/?waybill=${input.awb}`,
      {
        headers: {
          Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
        },
      }
    );

    const data = await resp.json();

    // possible keys:
    // - data.ShipmentData[0].Shipment.Scans -> [{ ScanDetail: { ScanDateTime, Scan, ScanDetail... } }, ...]
    // - data.ShipmentData[0].Shipment.ShipmentScan -> [{ Scan: "...", ScanDetail: "...", ScanDateTime: "..." }, ...]
    const rawScans =
      data?.ShipmentData?.[0]?.Shipment?.Scans ??
      data?.ShipmentData?.[0]?.Shipment?.ShipmentScan ??
      [];

    // normalize to { status, detail, time }
    const normalized = rawScans
      .map((item: any) => {
        // if item is { ScanDetail: { ... } }
        const scanDetail = item?.ScanDetail ?? item;
        const status =
          scanDetail?.Scan ?? item?.Scan ?? scanDetail?.Status ?? "Unknown";
        const detail =
          scanDetail?.Instructions ??
          scanDetail?.ScanDetail ??
          item?.ScanDetail?.Instructions ??
          "";
        const time =
          scanDetail?.ScanDateTime ??
          scanDetail?.StatusDateTime ??
          item?.ScanDateTime ??
          null;

        return {
          status,
          detail,
          time,
          // include raw for debugging if needed
          __raw: item,
        };
      })
      // remove items without any time & status if you want (optional)
      .filter((s: any) => s.status || s.detail || s.time);

    // sort by time ascending if time available (defensive)
    normalized.sort((a: any, b: any) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return -1;
      if (!b.time) return 1;
      const ta = new Date(a.time).getTime();
      const tb = new Date(b.time).getTime();
      return ta - tb;
    });

    // final mapping to return only needed fields
// final mapping to return only needed fields (with formatted time)
return normalized.map((s: any) => {
  let formattedTime = "";

  if (s.time) {
    const d = new Date(s.time);

    formattedTime = d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return {
    status: s.status,
    detail: s.detail,
    time: formattedTime, // formatted
  };
});

  }),



});
