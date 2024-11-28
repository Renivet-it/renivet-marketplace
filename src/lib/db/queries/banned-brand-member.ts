import {
    BannedBrandMemberWithMember,
    bannedBrandMemberWithMemberSchema,
    CreatedBannedBrandMember,
} from "@/lib/validations";
import { and, eq } from "drizzle-orm";
import { db } from "..";
import { bannedBrandMembers } from "../schema";

class BannedBrandMemberQuery {
    async getBannedMembers({
        brandId,
        limit,
        page,
        search,
    }: {
        brandId: string;
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.bannedBrandMembers.findMany({
            with: {
                member: true,
            },
            where: and(
                eq(bannedBrandMembers.brandId, brandId),
                !!search?.length
                    ? eq(bannedBrandMembers.memberId, search)
                    : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            extras: {
                count: db
                    .$count(
                        bannedBrandMembers,
                        and(
                            eq(bannedBrandMembers.brandId, brandId),
                            !!search?.length
                                ? eq(bannedBrandMembers.memberId, search)
                                : undefined
                        )
                    )
                    .as("member_count"),
            },
        });

        const parsed: BannedBrandMemberWithMember[] =
            bannedBrandMemberWithMemberSchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBannedMember(brandId: string, memberId: string) {
        const data = await db.query.bannedBrandMembers.findFirst({
            where: and(
                eq(bannedBrandMembers.brandId, brandId),
                eq(bannedBrandMembers.memberId, memberId)
            ),
        });

        return data;
    }

    async createBannedBrandMember(values: CreatedBannedBrandMember) {
        const data = await db
            .insert(bannedBrandMembers)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBannedBrandMember(brandId: string, memberId: string) {
        const data = await db
            .delete(bannedBrandMembers)
            .where(
                and(
                    eq(bannedBrandMembers.brandId, brandId),
                    eq(bannedBrandMembers.memberId, memberId)
                )
            )
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const bannedBrandMemberQueries = new BannedBrandMemberQuery();
