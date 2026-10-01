import { brandCache } from "@/lib/redis/methods";
import { CreateBrandInvite } from "@/lib/validations";
import { and, eq, lt, or, sql } from "drizzle-orm";
import { db } from "..";
import { brandInvites } from "../schema";

class BrandInviteQuery {
    async getBrandInvites(brandId: string) {
        const data = await brandCache.get(brandId);
        if (!data) return null;

        const filtered = data.invites
            .filter((invite) =>
                invite.expiresAt
                    ? new Date(invite.expiresAt) > new Date()
                    : true
            )
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );

        return {
            data: filtered,
            count: filtered.length,
        };
    }

    async getBrandInvite(code: string) {
        const data = await db.query.brandInvites.findFirst({
            where: eq(brandInvites.id, code),
            with: {
                brand: true,
            },
        });
        if (!data) return null;
        return data;
    }

    async createBrandInvite(
        brandId: string,
        values: Omit<CreateBrandInvite, "brandId">
    ) {
        const newInvite = await db
            .insert(brandInvites)
            .values({
                ...values,
                brandId,
            })
            .returning()
            .then((res) => res[0]);

        return newInvite;
    }

    async updateInviteUses(code: string, brandId: string) {
        const updated = await db
            .update(brandInvites)
            .set({
                uses: sql`${brandInvites.uses} + 1`,
            })
            .where(
                and(
                    eq(brandInvites.id, code),
                    eq(brandInvites.brandId, brandId),
                    or(eq(brandInvites.maxUses, 0), lt(brandInvites.uses, brandInvites.maxUses))
                )
            )
            .returning()
            .then((res) => res[0]);

        return updated;
    }

    async deleteBrandInvite(brandId: string, inviteId: string) {
        const deleted = await db
            .delete(brandInvites)
            .where(
                and(
                    eq(brandInvites.id, inviteId),
                    eq(brandInvites.brandId, brandId)
                )
            )
            .returning()
            .then((res) => res[0]);

        return deleted;
    }
}

export const brandInviteQueries = new BrandInviteQuery();
