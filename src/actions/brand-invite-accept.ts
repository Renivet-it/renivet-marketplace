"use server";

import { brandInviteQueries, brandMemberQueries } from "@/lib/db/queries";
import { brandCache, userCache } from "@/lib/redis/methods";

export async function acceptBrandInvite({
    brandId,
    memberId,
    code,
}: {
    brandId: string;
    memberId: string;
    code: string;
}) {
    const existingMember =
        await brandMemberQueries.getBrandMemberByMemberId(memberId);
    if (existingMember) {
        if (existingMember.brandId === brandId) return true;
        else
            throw new Error(
                "You can't accept a brand invite if you're already a member of a brand"
            );
    }

    await Promise.all([
        brandMemberQueries.createBrandMember({
            brandId,
            memberId,
            isOwner: false,
        }),
        brandInviteQueries.updateInviteUses(code),
        userCache.remove(memberId),
        brandCache.remove(brandId),
    ]);

    return true;
}
