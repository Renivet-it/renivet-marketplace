import { z } from "zod";
import { resolveDelhiveryUrl } from "@/lib/delhivery/url";
import { eq, and, like, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { sendWhatsAppMessage } from "@/lib/whatsapp/index";
import { swapRewardService } from "@/lib/services/swap-reward";
import { createFinanceRefundCase } from "@/lib/finance/refunds";

import { createTRPCRouter, isTRPCAuth, protectedProcedure } from "@/lib/trpc/trpc";
import type { Context } from "@/lib/trpc/context";
import { orderReturnRequests, orders, orderItems, users, orderShipments, brandConfidentials, refunds, rtoDispositions } from "@/lib/db/schema";
import { BitFieldSitePermission } from "@/config/permissions";
import { generatePickupLocationCode, hasPermission } from "@/lib/utils";
import { getFinanceModuleAccess } from "@/lib/finance/access";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";
import { buildReturnAttributionUpdate, requiresReturnAttributionNotes } from "@/lib/finance/return-attribution";
import { requiresNotesForCostAllocation, type RefundCostAllocation } from "@/lib/finance/refund-policy";
import Razorpay from "razorpay";
function formatIndianWhatsAppNumber(phone: string) {
  const cleaned = phone.replace(/\D/g, ""); // remove spaces, dashes

  // Already has country code
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // Local Indian number
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  throw new Error(`Invalid phone number: ${phone}`);
}

function normalizeReasonKey(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

async function resolveFinanceRefundReason(requestReason?: string | null) {
  const reasons = await financeComplianceQueries.listRefundReasons();
  const leafReasons = reasons.filter((reason) => reason.parentId);
  const key = normalizeReasonKey(requestReason);

  const candidates: Record<string, string[]> = {
    wrong_item: ["different product", "wrong item", "wrong size", "wrong color"],
    damaged: ["damaged product", "broken during transit", "packaging was damaged", "physical damage"],
    quality_issue: ["quality not as expected", "performance functionality issue", "stitching or finish is poor"],
    other: ["other"],
  };

  const matches = candidates[key] ?? [];
  const matchedLeaf =
    leafReasons.find((reason) =>
      matches.some((needle) => (reason.name ?? "").toLowerCase().includes(needle))
    ) ??
    reasons.find((reason) =>
      matches.some((needle) => (reason.name ?? "").toLowerCase().includes(needle))
    ) ??
    leafReasons[0] ??
    reasons[0];

  if (!matchedLeaf?.id) {
    throw new Error("No finance refund reasons are configured in reason_master.");
  }

  return { reason: matchedLeaf };
}

type AuthenticatedContext = Omit<Context, "user"> & {
  user: NonNullable<Context["user"]> & { sitePermissions: number; brandPermissions: number };
};

async function requireRefundModuleAccess(ctx: AuthenticatedContext, mode: "view" | "manage") {
  const access = await getFinanceModuleAccess({
    userId: ctx.user.id,
    sitePermissions: ctx.user.sitePermissions,
    roles: ctx.user.roles,
    moduleKey: "refunds",
  });
  if (!(mode === "manage" ? access.canManage : access.canView)) {
    throw new TRPCError({ code: "FORBIDDEN", message: `Refund ${mode} access is required.` });
  }
  return access;
}


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

             // 2️⃣ Update order_shipments flags (🔥 NEW LOGIC)
        await ctx.db
          .update(orderShipments)
          .set({
            is_return_label_generated: input.requestType === "return",
            is_replacement_label_generated: input.requestType === "replace",
          })
      .where(eq(orderShipments.orderId, input.orderId));



        // 3️⃣ Fetch order + user
        const [order] = await ctx.db
            .select({
              id: orders.id,
              userId: orders.userId,
              paymentId: orders.paymentId,
              totalAmount: orders.totalAmount,
            })
            .from(orders)
            .where(eq(orders.id, input.orderId));

        if (!order) throw new Error("Order not found");

        if (input.requestType === "return") {
            const existingFinanceRefund = await financeComplianceQueries.getRefundByOrderId(
              input.orderId
            );

            if (!existingFinanceRefund) {
              const { reason } = await resolveFinanceRefundReason(input.reason);

              await createFinanceRefundCase({
                orderId: order.id,
                userId: order.userId,
                paymentId: order.paymentId ?? "",
                amountPaise: order.totalAmount,
                reasonCode: reason.id,
                notes: input.comment ?? input.reason ?? undefined,
                refundType: "full",
                evidenceUrls: Array.isArray(input.images)
                  ? input.images.filter((value): value is string => typeof value === "string")
                  : [],
                actorId: ctx.user.id,
                source: "customer_return_request",
                sourceContext: {
                  customerReturnRequestReason: input.reason ?? null,
                },
              });
            }
        }

        const [user] = await ctx.db
            .select({ name: users.firstName, phone: users.phone })
            .from(users)
            .where(eq(users.id, order.userId));

        if (user && user.phone) {
            const formattedUserPhone = formatIndianWhatsAppNumber(user.phone);
            const userTemplate =
                input.requestType === "return"
                    ? "return_initiated_user"
                    : "replace_initiated_user";

            Promise.allSettled([
                sendWhatsAppMessage({
                    recipientPhoneNumber: formattedUserPhone,
                    templateName: userTemplate,
                    parameters: [user.name, order.id],
                }),
                sendWhatsAppMessage({
                    recipientPhoneNumber: "+918983676772", // Admin number
                    templateName: "return_replace_admin",
                    parameters: [
                        input.requestType.toUpperCase(),
                        order.id,
                        user.name,
                        input.reason ?? "N/A",
                    ],
                }),
            ]);
        }
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
            await requireRefundModuleAccess(ctx as AuthenticatedContext, "view");
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

    getAttributionContext: protectedProcedure
      .input(z.object({ requestId: z.string() }))
      .query(async ({ ctx, input }) => {
        const access = await requireRefundModuleAccess(ctx as AuthenticatedContext, "view");
        const request = await ctx.db.query.orderReturnRequests.findFirst({
          where: (r, { eq }) => eq(r.id, input.requestId),
        });
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Return request not found." });

        const refund = await ctx.db.query.refunds.findFirst({
          where: (r, { eq }) => eq(r.orderId, request.orderId),
        });
        const rto = await ctx.db.query.rtoDispositions.findFirst({
          where: (r, { eq }) => eq(r.orderId, request.orderId),
        });
        const [refundAudit, rtoAudit] = await Promise.all([
          refund
            ? ctx.queries.financeCompliance.listFinanceAuditLogs({ entityType: "refund", entityId: refund.id, actionType: "return_attribution_set", limit: 20 })
            : Promise.resolve([]),
          rto
            ? ctx.queries.financeCompliance.listFinanceAuditLogs({ entityType: "rto_disposition", entityId: rto.id, actionType: "rto_attribution_set", limit: 20 })
            : Promise.resolve([]),
        ]);

        return {
          request: { id: request.id, orderId: request.orderId, requestType: request.requestType },
          refund: refund
            ? {
                id: refund.id,
                costAllocation: refund.costAllocation,
                policyBucket: refund.policyBucket,
                notes: refund.notes,
              }
            : null,
          rto: rto
            ? {
                id: rto.id,
                faultOwner: rto.faultOwner,
                rtoReason: rto.rtoReason,
                recoveryDecision: rto.recoveryDecision,
                notes: rto.notes,
                status: rto.status,
              }
            : null,
          auditHistory: [...refundAudit, ...rtoAudit]
            .sort((a, b) => b.timestampUtc.getTime() - a.timestampUtc.getTime())
            .map((entry) => ({
              id: entry.id,
              timestampUtc: entry.timestampUtc,
              actorId: entry.userId,
              beforeValue: entry.beforeValue,
              afterValue: entry.afterValue,
            })),
          canManageRefunds: access.canManage,
          canManageRto: hasPermission(ctx.user.sitePermissions, [BitFieldSitePermission.MANAGE_ORDERS]),
        };
      }),

    setReturnAttribution: protectedProcedure
      .input(z.object({
        requestId: z.string(),
        costAllocation: z.enum(["brand_fault", "customer_fault", "renivet_fault", "carrier_fault"]),
        notes: z.string().max(2000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await requireRefundModuleAccess(ctx as AuthenticatedContext, "manage");
        const request = await ctx.db.query.orderReturnRequests.findFirst({
          where: (r, { eq }) => eq(r.id, input.requestId),
        });
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Return request not found." });

        const refund = await ctx.db.query.refunds.findFirst({
          where: (r, { eq }) => eq(r.orderId, request.orderId),
        });
        if (!refund) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No refund case exists for this request." });

        const lockedCycle = await financeComplianceQueries.findLockedPayoutCycleForReferences([
          refund.id,
          request.orderId,
        ]);
        if (lockedCycle) {
          throw new TRPCError({ code: "CONFLICT", message: "Attribution is locked because this case is in an approved payout cycle." });
        }

        if (requiresReturnAttributionNotes({ previous: refund.costAllocation, next: input.costAllocation })) {
          if (!input.notes?.trim()) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Notes are required when reclassifying attribution." });
          }
        }
        if (requiresNotesForCostAllocation(input.costAllocation as RefundCostAllocation) && !input.notes?.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Notes are required for this attribution." });
        }

        const update = buildReturnAttributionUpdate({
          previous: refund.costAllocation as RefundCostAllocation | null,
          next: input.costAllocation,
          notes: input.notes,
        });
        await ctx.db.update(refunds).set(update).where(eq(refunds.id, refund.id));
        await writeFinanceAuditEvent({
          actorId: ctx.user.id,
          actorType: "admin",
          actionType: "return_attribution_set",
          entityType: "refund",
          entityId: refund.id,
          reason: update.notes,
          beforeValue: { costAllocation: refund.costAllocation, policyBucket: refund.policyBucket },
          afterValue: { costAllocation: update.costAllocation, policyBucket: update.policyBucket },
        });
        return { success: true };
      }),

    setRtoAttribution: protectedProcedure
      .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
      .input(z.object({
        requestId: z.string(),
        faultOwner: z.enum(["customer", "carrier", "brand", "renivet", "unknown"]),
        notes: z.string().max(2000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const request = await ctx.db.query.orderReturnRequests.findFirst({
          where: (r, { eq }) => eq(r.id, input.requestId),
        });
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Return request not found." });
        const rto = await ctx.db.query.rtoDispositions.findFirst({
          where: (r, { eq }) => eq(r.orderId, request.orderId),
        });
        if (!rto) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No RTO disposition exists for this request." });

        const lockedCycle = await financeComplianceQueries.findLockedPayoutCycleForReferences([
          rto.id,
          request.orderId,
        ]);
        if (lockedCycle) {
          throw new TRPCError({ code: "CONFLICT", message: "RTO attribution is locked because this case is in an approved payout cycle." });
        }
        if (rto.faultOwner !== input.faultOwner && !input.notes?.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Notes are required when reclassifying RTO attribution." });
        }

        await ctx.db.update(rtoDispositions).set({
          faultOwner: input.faultOwner,
          notes: input.notes?.trim() || rto.notes,
          handledBy: ctx.user.id,
          dispositionAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(rtoDispositions.id, rto.id));
        await writeFinanceAuditEvent({
          actorId: ctx.user.id,
          actorType: "admin",
          actionType: "rto_attribution_set",
          entityType: "rto_disposition",
          entityId: rto.id,
          reason: input.notes,
          beforeValue: { faultOwner: rto.faultOwner, notes: rto.notes },
          afterValue: { faultOwner: input.faultOwner, notes: input.notes?.trim() || rto.notes },
        });
        return { success: true };
      }),

    // -------------------------------------------------------
    // 3️⃣ APPROVE REQUEST
    // -------------------------------------------------------
    // approveRequest: protectedProcedure
    //     .input(
    //         z.object({
    //             id: z.string(),
    //         })
    //     )
    //     .mutation(async ({ ctx, input }) => {
    //         await ctx.db
    //             .update(orderReturnRequests)
    //             .set({
    //                 status: "approved",
    //                 updatedAt: new Date(),
    //             })
    //             .where(eq(orderReturnRequests.id, input.id));

    //         return { success: true };
    //     }),
    approveRequest: protectedProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // 1️⃣ Update status
    const [request] = await ctx.db
      .update(orderReturnRequests)
      .set({
        status: "approved",
        updatedAt: new Date(),
      })
      .where(eq(orderReturnRequests.id, input.id))
      .returning();

    if (!request) {
      throw new Error("Return / replacement request not found");
    }

    // 2️⃣ Fetch order + user
    const [order] = await ctx.db
      .select({
        id: orders.id,
        userId: orders.userId,
        paymentId: orders.paymentId,
        totalAmount: orders.totalAmount,
      })
      .from(orders)
      .where(eq(orders.id, request.orderId));

    if (!order) throw new Error("Order not found");

    if (request.requestType === "return") {
      const existingFinanceRefund = await financeComplianceQueries.getRefundByOrderId(
        request.orderId
      );

      if (!existingFinanceRefund) {
        const { reason } = await resolveFinanceRefundReason(request.reason);

        await createFinanceRefundCase({
          orderId: order.id,
          userId: order.userId,
          paymentId: order.paymentId ?? "",
          amountPaise: order.totalAmount,
          reasonCode: reason.id,
          notes: request.comment ?? request.reason ?? undefined,
          refundType: "full",
          evidenceUrls: Array.isArray(request.images)
            ? request.images.filter((value): value is string => typeof value === "string")
            : [],
          actorId: ctx.user.id,
          source: "customer_return_approved",
          sourceContext: {
            customerReturnRequestId: request.id,
            customerReturnReasonKey: request.reason ?? null,
          },
        });
      }
    }

    const [user] = await ctx.db
      .select({ name: users.firstName, phone: users.phone })
      .from(users)
      .where(eq(users.id, order.userId));

    if (user && user.phone) {
      const formattedUserPhone = formatIndianWhatsAppNumber(user.phone);
      // 3️⃣ WhatsApp (NON-BLOCKING)
      Promise.allSettled([
        sendWhatsAppMessage({
          recipientPhoneNumber: formattedUserPhone, // must be +91 format
          templateName: "return_replace_approved_user",
          parameters: [
            user.name,
            request.requestType.toUpperCase(), // RETURN / REPLACE
            order.id,
          ],
        }),
      ]);
    }

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
    // 1️⃣ Update status
    const [request] = await ctx.db
      .update(orderReturnRequests)
      .set({
        status: "rejected",
        comment: input.comment ?? null,
        updatedAt: new Date(),
      })
      .where(eq(orderReturnRequests.id, input.id))
      .returning();

    // 2️⃣ Fetch order + user
    const [order] = await ctx.db
      .select({ id: orders.id, userId: orders.userId })
      .from(orders)
      .where(eq(orders.id, request.orderId));

    if (!order) throw new Error("Order not found");

    const [user] = await ctx.db
      .select({ name: users.firstName, phone: users.phone })
      .from(users)
      .where(eq(users.id, order.userId));

    if (user && user.phone) {
      const formattedUserPhone = formatIndianWhatsAppNumber(user.phone);
      // 3️⃣ WhatsApp with reject comment
      Promise.allSettled([
        sendWhatsAppMessage({
          recipientPhoneNumber: formattedUserPhone,
          templateName: "return_replace_rejected_user",
          parameters: [
            user.name,
            request.requestType.toUpperCase(),
            order.id,
            input.comment ?? "Request does not meet our return policy",
          ],
        }),
      ]);
    }

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
            const [request] = await ctx.db
                .update(orderReturnRequests)
                .set({
                    status: "completed",
                    updatedAt: new Date(),
                })
                .where(eq(orderReturnRequests.id, input.id))
                .returning();

            if (request?.requestType === "return") {
                try {
                    await swapRewardService.revokeStampForOrder(
                        request.orderId,
                        "return_completed"
                    );
                } catch (error) {
                    console.error("swap reward revoke failed", error);
                }
            }

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
    const paymentId = customer.paymentId;
    const itemPrice = request.orderItem.variant?.price ?? request.orderItem.product.price ?? 0;

    // Playbook Rule: For items under ₹500 (50000 paise), skip reverse pickup. Refund and let customer keep/discard.
    if (itemPrice < 50000) {
      console.log(`💰 Item price ${itemPrice / 100} INR is under ₹500. Skipping reverse pickup and issuing refund.`);
      if (!paymentId) {
        console.error("❌ No paymentId found for refund");
      } else {
        console.log("💰 Initiating full refund for payment:", paymentId);
        const razorpay = new Razorpay({
          key_id: process.env.RAZOR_PAY_KEY_ID!,
          key_secret: process.env.RAZOR_PAY_SECRET_KEY!,
        });
        try {
          const refund = await razorpay.payments.refund(paymentId, {
            amount: customer.totalAmount,
          });
          console.log("💰 Razorpay Refund Response →", refund);
        } catch (err) {
          console.error("❌ Razorpay Refund Error →", err);
        }
      }

      await ctx.db
        .update(orderReturnRequests)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(orderReturnRequests.id, request.id));

      return { success: true, skippedPickup: true };
    }

    const brandConf = await ctx.db.query.brandConfidentials.findFirst({
      where: eq(brandConfidentials.id, request.orderItem.product.brandId),
    });
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

      return_name: brandConf.authorizedSignatoryName,
      return_address: brandConf.addressLine1,
      return_pin: String(brandConf.postalCode),
      return_city: brandConf.city,
      return_state: brandConf.state,
      return_country: "India",
      return_phone: [brandConf.authorizedSignatoryPhone],

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
    const resp = await fetch(resolveDelhiveryUrl(process.env.DELHIVERY_BASE_URL, "/api/cmu/create.json"), {
      method: "POST",
      headers: {
        Authorization: "Token " + process.env.DELHIVERY_TOKEN!,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString(),
    });

    const delhiveryResponse = await resp.json();
    console.log("📩 Delhivery RTO Raw Response →", delhiveryResponse);

    if (!paymentId) {
      console.error("❌ No paymentId found for refund");
    } else {
      console.log("💰 Initiating full refund for payment:", paymentId);

      const razorpay = new Razorpay({
        key_id: process.env.RAZOR_PAY_KEY_ID!,
        key_secret: process.env.RAZOR_PAY_SECRET_KEY!,
      });

      try {
        const refund = await razorpay.payments.refund(paymentId, {
          amount: customer.totalAmount,
        });
        console.log("💰 Razorpay Refund Response →", refund);
      } catch (err) {
        console.error("❌ Razorpay Refund Error →", err);
      }
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
                brand: true
              }
            },
            variant: true,
          },
        },
      },
    });

    if (!request) throw new Error("Request not found");
    if (request.requestType !== "replace")
      throw new Error("Not a replace request");

    if (!request.newVariantId) throw new Error("New variant ID is required for replace request");

    const newVariant = await ctx.db.query.productVariants.findFirst({
      where: (v, { eq }) => eq(v.id, request.newVariantId!),
      with: {
        product: true,
      },
    });

    const customer = request.order;
    const product = request.orderItem.product;
    const brandConf = await ctx.db.query.brandConfidentials.findFirst({
      where: eq(brandConfidentials.id, product.brandId),
    });

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
      return_phone: [brandConf.authorizedSignatoryPhone],

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
    const resp = await fetch(resolveDelhiveryUrl(process.env.DELHIVERY_BASE_URL, "/api/cmu/create.json"), {
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
      `${resolveDelhiveryUrl(process.env.DELHIVERY_BASE_URL, "/api/v1/packages/json/")}?waybill=${encodeURIComponent(input.awb)}`,
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
