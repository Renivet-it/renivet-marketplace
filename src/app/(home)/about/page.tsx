import {
    AboutCoreValues,
    AboutFrustration,
    AboutHero,
    AboutMissionVision,
    Team,
} from "@/components/about";
import { GeneralShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us",
    description: "Learn more about us.",
};

import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function Page() {
    return (
        <GeneralShell
            classNames={{
                mainWrapper: "p-0",
                innerWrapper: "!p-0 !max-w-none !space-y-0",
            }}
        >
            <div className="bg-[#F9F6F1]">
                <AboutHero />
                <ScrollReveal><AboutFrustration /></ScrollReveal>
                <ScrollReveal><AboutCoreValues /></ScrollReveal>
                <ScrollReveal><AboutMissionVision /></ScrollReveal>
                {/* <Team className="container mx-auto py-20" /> */}
            </div>
        </GeneralShell>
    );
}
