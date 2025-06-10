import { returnOrderPayloadValidationSchema } from "@/lib/store/validation/return-store-validation";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";

export const OrderReturnRouter = createTRPCRouter({
    createReturnOrder: protectedProcedure
        .input(returnOrderPayloadValidationSchema)
        .mutation(async ({ input, ctx }) => {
            if (input === null || input === undefined) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Payload is courrupted or missing",
                });
            }
        }),
});
