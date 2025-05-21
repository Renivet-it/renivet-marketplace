import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import {
    addressSchema,
    brandDetailsAddressWithSafeSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const addressesRouter = createTRPCRouter({
    getAddressById: protectedProcedure
        .input(
            z.object({
                addressId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { addressId } = input;
            const data = await queries.addresses.getAddressById(addressId);
            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User address not found",
                });
            const parsed = addressSchema
                .omit({ createdAt: true, updatedAt: true })
                .parse(data);
            return parsed;
        }),
    getBrandAddressFromOrderID: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { orderId } = input;
            const data =
                await queries.addresses.getBrandAddressFromOrderID(orderId);
            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand address not found",
                });
            const parsed = brandDetailsAddressWithSafeSchema
                .parse(data);
            return parsed;
        }),
            getBrandConfidential: protectedProcedure
        .input(
            z.object({
                brandId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { brandId } = input;
            const data =
                await queries.addresses.getBrandConfidentials(brandId);
            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand address not found",
                });
            const parsed = brandDetailsAddressWithSafeSchema
                .parse(data);
            return parsed;
        }),
});
