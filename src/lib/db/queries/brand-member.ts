import {
    BrandMemberWithMemberAndRoles,
    brandMemberWithMemberAndRolesSchema,
    CreateBrandMember,
    UpdateBrandMember,
} from "@/lib/validations";
import { and, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { brandMembers } from "../schema";

class BrandMemberQuery {
    async getBrandMembers({
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
        const data = await db.query.brandMembers.findMany({
            with: {
                member: {
                    with: {
                        roles: {
                            with: {
                                role: true,
                            },
                        },
                    },
                },
            },
            where: and(
                eq(brandMembers.brandId, brandId),
                !!search?.length ? eq(brandMembers.memberId, search) : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            extras: {
                count: db
                    .$count(
                        brandMembers,
                        and(
                            eq(brandMembers.brandId, brandId),
                            !!search?.length
                                ? ilike(brandMembers.memberId, `%${search}%`)
                                : undefined
                        )
                    )
                    .as("member_count"),
            },
        });

        const parsed: BrandMemberWithMemberAndRoles[] =
            brandMemberWithMemberAndRolesSchema.array().parse(
                data.map(({ member, ...rest }) => ({
                    ...rest,
                    member,
                    roles: member.roles.map(({ role }) => role),
                }))
            );

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBrandMemberByMemberId(memberId: string) {
        const data = await db.query.brandMembers.findFirst({
            where: eq(brandMembers.memberId, memberId),
        });

        return data;
    }

    async createBrandMember(values: CreateBrandMember) {
        const data = await db
            .insert(brandMembers)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBrandMember(id: string, values: UpdateBrandMember) {
        const data = await db
            .update(brandMembers)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(brandMembers.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBrandMember(brandId: string, memberId: string) {
        const data = await db
            .delete(brandMembers)
            .where(
                and(
                    eq(brandMembers.brandId, brandId),
                    eq(brandMembers.memberId, memberId)
                )
            )
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const brandMemberQueries = new BrandMemberQuery();
