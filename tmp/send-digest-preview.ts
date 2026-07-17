import "dotenv/config";

import { createMarketingCampaign, sendDigestCampaign } from "../src/lib/marketing/email";

async function main() {
    const campaign = await createMarketingCampaign({
        name: `digest-preview-${new Date().toISOString()}`,
        type: "new_arrivals",
        subject: "Renivet digest preview",
        contentHtml: "",
        status: "draft",
        metadata: {
            intro: "A quick preview of the updated Renivet digest layout.",
            defaultLimit: 4,
            audienceType: "manual",
            manualRecipients: ["ayanganguly333@gmail.com"],
        },
    });

    const result = await sendDigestCampaign(campaign.id);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
