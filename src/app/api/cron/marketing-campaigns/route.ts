import { marketingQueries } from "@/lib/db/queries";
import { requireCronSecret } from "@/lib/auth/cron-access";
import { sendDigestCampaign } from "@/lib/marketing/email";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    const dueCampaigns = await marketingQueries.getScheduledCampaignsDue();

    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const campaign of dueCampaigns) {
        if (
            campaign.type !== "new_arrivals" &&
            campaign.type !== "blog_digest"
        ) {
            skipped += 1;
            continue;
        }

        processed += 1;
        const result = await sendDigestCampaign(campaign.id);
        sent += result.sent;
        skipped += result.skipped;
        failed += result.failed;
    }

    return NextResponse.json({
        ok: true,
        dueCampaigns: dueCampaigns.length,
        processed,
        sent,
        skipped,
        failed,
    });
}
