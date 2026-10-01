"use server";

import { auth } from "@clerk/nextjs/server";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { brandInviteQueries, brandMemberQueries } from "@/lib/db/queries";
import { posthog } from "@/lib/posthog/server";
import { brandCache, userCache } from "@/lib/redis/methods";

export async function acceptBrandInvite({
    brandId,
    code,
}: {
    brandId: string;
    code: string;
}) {
    const { userId: memberId } = await auth();
    if (!memberId) throw new Error("You must be signed in to accept an invite.");

    const invite = await brandInviteQueries.getBrandInvite(code);
    if (!invite || invite.brandId !== brandId) throw new Error("Invalid brand invite.");
    if (invite.expiresAt && new Date(invite.expiresAt) <= new Date()) throw new Error("This invite has expired.");
    if (invite.maxUses > 0 && invite.uses >= invite.maxUses) throw new Error("This invite has no remaining uses.");

    const existingMember =
        await brandMemberQueries.getBrandMemberByMemberId(memberId);
    if (existingMember) {
        if (existingMember.brandId === brandId) return true;
        else
            throw new Error(
                "You can't accept a brand invite if you're already a member of a brand"
            );
    }

    const updatedInvite = await brandInviteQueries.updateInviteUses(code, brandId);
    if (!updatedInvite) throw new Error("This invite has no remaining uses.");

    await Promise.all([
        brandMemberQueries.createBrandMember({
            brandId,
            memberId,
            isOwner: false,
        }),
        userCache.remove(memberId),
        brandCache.remove(brandId),
    ]);

    posthog.capture({
        event: POSTHOG_EVENTS.BRAND.INVITE.ACCEPTED,
        distinctId: brandId,
        properties: {
            memberId,
            code,
        },
    });

    posthog.capture({
        event: POSTHOG_EVENTS.BRAND.MEMBER.JOINED,
        distinctId: brandId,
        properties: {
            memberId,
        },
    });

    return true;
}
