import { env } from "@/../env";
import { BitFieldBrandPermission, BitFieldSitePermission } from "@/config/permissions";
import { createClientWarehouse } from "@/lib/delhivery/warehouse";
import { brandCache, userCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import { BrandVerificationtSubmitted } from "@/lib/resend/emails";
import { shiprocket } from "@/lib/shiprocket";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { generatePickupLocationCode, getRawNumberFromPhone } from "@/lib/utils";
import {
    createBrandConfidentialSchema,
    updateBrandConfidentialSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

function assertBrandConfidentialAccess(ctx: any, brand: { ownerId: string }) {
    const isSiteAdmin = ctx.user.sitePermissions & BitFieldSitePermission.ADMINISTRATOR;
    if (!isSiteAdmin && brand.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Brand access denied." });
    }
}

function changesVerifiedIdentity(
    current: Record<string, unknown>,
    next: Record<string, unknown>
) {
    return [
        "bankName",
        "bankAccountHolderName",
        "bankAccountNumber",
        "bankIfscCode",
        "pan",
        "gstin",
    ].some((field) => current[field] !== next[field]);
}

export const confidentialsRouter = createTRPCRouter({
    createConfidential: protectedProcedure
        .input(createBrandConfidentialSchema)
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });
            assertBrandConfidentialAccess(ctx, existingBrand);

            const existingBrandConfidential =
                await queries.brandConfidentials.getBrandConfidential(id);
            if (existingBrandConfidential)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Confidential already exists",
                });

            const sr = await shiprocket();

            const { status, message } = await sr.createPickUpLocation({
                pickup_location: generatePickupLocationCode({
                    brandId: existingBrand.id,
                    brandName: existingBrand.name,
                }),
                name: input.authorizedSignatoryName,
                email: input.authorizedSignatoryEmail,
                phone: getRawNumberFromPhone(input.authorizedSignatoryPhone),
                address: input.warehouseAddressLine1 ?? input.addressLine1,
                address_2:
                    input.warehouseAddressLine2 ??
                    input.addressLine2 ??
                    undefined,
                city: input.warehouseCity ?? input.city,
                state: input.warehouseState ?? input.state,
                pin_code: +(input.warehousePostalCode ?? input.postalCode),
                country: "India",
            });
            if (!status) throw new TRPCError({ code: "BAD_REQUEST", message });
            const pickupLocationCode = generatePickupLocationCode({
                brandId: existingBrand.id,
                brandName: existingBrand.name,
            });
            const phone = String(
                getRawNumberFromPhone(input.authorizedSignatoryPhone) ??
                    "9999999999"
            );

            const delhiveryPayload = {
                name: pickupLocationCode,
                registered_name: existingBrand.name,
                phone,
                email: input.authorizedSignatoryEmail,
                address: input.warehouseAddressLine1 ?? input.addressLine1,
                city: input.warehouseCity ?? input.city,
                pin: String(input.warehousePostalCode ?? input.postalCode),
                country: "India",
                return_address:
                    input.warehouseAddressLine1 ?? input.addressLine1,
                return_city: input.warehouseCity ?? input.city,
                return_pin: String(
                    input.warehousePostalCode ?? input.postalCode
                ),
                return_state: input.warehouseState ?? input.state,
                return_country: "India",
            };

            const delhiveryResult =
                await createClientWarehouse(delhiveryPayload);

            if (!delhiveryResult.success) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        delhiveryResult.error ||
                        "Delhivery warehouse creation failed",
                });
            }
            const [data] = await Promise.all([
                queries.brandConfidentials.createBrandConfidential(input),
                queries.brands.updateBrandConfidentialStatus({
                    id,
                    confidentialVerificationStatus: "pending",
                }),
                brandCache.remove(id),
                userCache.remove(existingBrand.ownerId),
            ]);

            await resend.batch.send([
                {
                    from: env.RESEND_EMAIL_FROM,
                    to: existingBrand.email,
                    subject: `🚀 Verification Liftoff Achieved, ${existingBrand.name}! 🚀`,
                    react: BrandVerificationtSubmitted({
                        user: {
                            name: existingBrand.name,
                        },
                        brand: {
                            id: existingBrand.id,
                            status: "pending",
                            name: existingBrand.name,
                        },
                    }),
                },
                {
                    from: env.RESEND_EMAIL_FROM,
                    to: env.RENIVET_EMAIL_1,
                    subject: `🚀 Verification Liftoff Achieved, ${existingBrand.name}! 🚀`,
                    react: BrandVerificationtSubmitted({
                        user: {
                            name: existingBrand.name,
                        },
                        brand: {
                            id: existingBrand.id,
                            status: "pending",
                            name: existingBrand.name,
                        },
                    }),
                },
                {
                    from: env.RESEND_EMAIL_FROM,
                    to: env.RENIVET_EMAIL_2,
                    subject: `🚀 Verification Liftoff Achieved, ${existingBrand.name}! 🚀`,
                    react: BrandVerificationtSubmitted({
                        user: {
                            name: existingBrand.name,
                        },
                        brand: {
                            id: existingBrand.id,
                            status: "pending",
                            name: existingBrand.name,
                        },
                    }),
                },
            ]);

            return data;
        }),
    updateConfidential: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                values: updateBrandConfidentialSchema,
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id, values } = input;

            const confidential = await queries.brandConfidentials.getBrandConfidential(id);
            if (!confidential) throw new TRPCError({ code: "NOT_FOUND", message: "Confidential not found" });
            assertBrandConfidentialAccess(ctx, confidential.brand);

            const existingBrandConfidential = confidential;
            if (!existingBrandConfidential)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Confidential not found",
                });

            if (existingBrandConfidential.verificationStatus === "approved")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Confidential already verified",
                });

            const [data] = await Promise.all([
                queries.brandConfidentials.updateBrandConfidential(id, values),
                queries.brandConfidentials.updateBrandConfidentialStatus(id, {
                    status: "pending",
                }),
                queries.brands.updateBrandConfidentialStatus({
                    id,
                    confidentialVerificationStatus: "pending",
                    confidentialVerificationRejectedAt: null,
                    confidentialVerificationRejectedReason: null,
                }),
                brandCache.remove(id),
                userCache.remove(existingBrandConfidential.brand.ownerId),
            ]);

            return data;
        }),
    // New endpoint: Update confidential details without affecting verification status
    updateConfidentialDetails: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                values: updateBrandConfidentialSchema,
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id, values } = input;

            const existingBrandConfidential =
                await queries.brandConfidentials.getBrandConfidential(id);
            if (!existingBrandConfidential)
                    throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Confidential not found",
                    });
            assertBrandConfidentialAccess(ctx, existingBrandConfidential.brand);

            const resetVerification = changesVerifiedIdentity(existingBrandConfidential, values);

            // Update without changing verification status
            const [data] = await Promise.all([
                queries.brandConfidentials.updateBrandConfidential(id, values),
                resetVerification
                    ? Promise.all([
                        queries.brandConfidentials.updateBrandConfidentialStatus(id, { status: "pending" }),
                        queries.brands.updateBrandConfidentialStatus({
                            id: existingBrandConfidential.brandId,
                            confidentialVerificationStatus: "pending",
                            confidentialVerificationRejectedAt: null,
                            confidentialVerificationRejectedReason: null,
                        }),
                    ])
                    : Promise.resolve(),
                brandCache.remove(existingBrandConfidential.brandId),
                userCache.remove(existingBrandConfidential.brand.ownerId),
            ]);

            return data;
        }),
});
