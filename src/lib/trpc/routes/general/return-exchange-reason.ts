import { db } from "@/lib/db";
import { reasonMasters } from "@/lib/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { TreeSchema } from "@/lib/validations/reason";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const ReasonRouter = createTRPCRouter({
    getSpecificReason: protectedProcedure
        .input(
            z.object({
                type: z.string(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { type } = input;
            const reasons = await db
                .select()
                .from(reasonMasters)
                .where(
                    and(
                        eq(reasonMasters.isActive, true),
                        eq(reasonMasters.reasonType, type)
                    )
                );
            const result = buildReasonTree(reasons);
            const parsedResult = TreeSchema.parse(result);
            return parsedResult;
        }),
});

function buildReasonTree(flatList: any) {
    const map = new Map();
    const tree: any = [];

    flatList.forEach((item: any) => {
        map.set(item.id, { ...item, children: [] });
    });

    flatList.forEach((item: any) => {
        const node = map.get(item.id);
        if (item.parentId) {
            const parent = map.get(item.parentId);
            if (parent) {
                parent.children.push(node);
            }
        } else {
            tree.push(node);
        }
    });

    return tree;
}
