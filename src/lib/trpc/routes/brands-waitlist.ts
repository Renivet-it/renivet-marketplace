import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { createBrandWaitlistSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const brandsWaitlistRouter = createTRPCRouter({
    getBrandsWaitlist: protectedProcedure.query(async ({ ctx }) => {
        const { db } = ctx;

        const brandsWaitlist = await db.query.brandsWaitlist.findMany();
        return brandsWaitlist;
    }),
    getBrandsWaitlistEntry: protectedProcedure
        .input(
            z
                .object({
                    id: z.string().optional(),
                    brandEmail: z.string().optional(),
                })
                .refine((input) => {
                    if (!input.id && !input.brandEmail)
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "ID or brand email is required",
                        });

                    return true;
                })
        )
        .query(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, brandEmail } = input;

            const brandsWaitlistEntry = await db.query.brandsWaitlist.findFirst(
                {
                    where: id
                        ? eq(schemas.brandsWaitlist.id, id)
                        : brandEmail
                          ? eq(schemas.brandsWaitlist.brandEmail, brandEmail)
                          : undefined,
                }
            );
            if (!brandsWaitlistEntry)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brands waitlist entry not found",
                });

            return brandsWaitlistEntry;
        }),
    createBrandsWaitlistEntry: publicProcedure
        .input(createBrandWaitlistSchema)
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;

            const existingBrandsWaitlistEntry =
                await db.query.brandsWaitlist.findFirst({
                    where: eq(
                        schemas.brandsWaitlist.brandEmail,
                        input.brandEmail
                    ),
                });
            if (existingBrandsWaitlistEntry)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Brands waitlist entry already exists",
                });

            const brandsWaitlistEntry = await db
                .insert(schemas.brandsWaitlist)
                .values(input)
                .returning()
                .then((res) => res[0]);

            return brandsWaitlistEntry;
        }),
    deleteBrandsWaitlistEntry: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const existingBrandsWaitlistEntry =
                await db.query.brandsWaitlist.findFirst({
                    where: eq(schemas.brandsWaitlist.id, id),
                });
            if (!existingBrandsWaitlistEntry)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brands waitlist entry not found",
                });

            await db
                .delete(schemas.brandsWaitlist)
                .where(eq(schemas.brandsWaitlist.id, id));

            return null;
        }),
});
