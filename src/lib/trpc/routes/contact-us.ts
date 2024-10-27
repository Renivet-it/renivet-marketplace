import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { createContactUsSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const contactUsRouter = createTRPCRouter({
    getContactUs: protectedProcedure.query(async ({ ctx }) => {
        const { db } = ctx;

        const contactUs = await db.query.contactUs.findMany();
        return contactUs;
    }),
    getContactUsSingle: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const contactUs = await db.query.contactUs.findFirst({
                where: eq(schemas.contactUs.id, id),
            });
            if (!contactUs) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Entry not found",
                });
            }

            return contactUs;
        }),
    createContactUs: publicProcedure
        .input(createContactUsSchema)
        .mutation(async ({ input, ctx }) => {
            const { db, schemas } = ctx;

            const newEntry = await db
                .insert(schemas.contactUs)
                .values(input)
                .returning()
                .then((res) => res[0]);

            return newEntry;
        }),
    deleteContactUs: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const contactUs = await db.query.contactUs.findFirst({
                where: eq(schemas.contactUs.id, id),
            });
            if (!contactUs) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Entry not found",
                });
            }

            await db
                .delete(schemas.contactUs)
                .where(eq(schemas.contactUs.id, id));

            return true;
        }),
});
