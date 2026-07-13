import { marketingQueries } from "@/lib/db/queries";
import { sendDigestCampaign } from "@/lib/marketing/email";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
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
