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
            src: "/assets/festive-season/rakhi.png",
            width: 140,
            height: 465,
            alt: "Renivet Rakhi Collection",
        },
        mobileHero: {
            src: "/assets/festive-season/rakhi-mobile-cutout-trimmed.png",
            alt: "",
        },
        desktopHero: {
            src: "/assets/festive-season/rakhi.png",
            alt: "",
        },
    },
} as const;
