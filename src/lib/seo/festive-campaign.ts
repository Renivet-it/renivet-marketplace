const campaignName = "Rakhi Collection";
const campaignDescription =
    "Discover Renivet's curated Rakhi collection, selected for conscious celebrations and thoughtful gifting.";

export const FESTIVE_CAMPAIGN = {
    name: campaignName,
    heading: "Celebrate Rakhi Consciously with Sustainable Picks",
    description: campaignDescription,
    social: {
        title: `${campaignName} | Renivet`,
        description: campaignDescription,
    },
    art: {
        openGraph: {
            src: "/assets/festive-season/festive-banner-desktop.png",
            width: 2880,
            height: 1216,
            alt: "Celebrate consciously with Renivet's sustainable festive picks",
        },
        mobileHero: {
            src: "/assets/festive-season/festive-banner.png",
            alt: "Celebrate consciously with sustainable festive picks",
        },
        desktopHero: {
            src: "/assets/festive-season/festive-banner-desktop.png",
            alt: "Celebrate consciously with sustainable festive picks",
        },
    },
} as const;
