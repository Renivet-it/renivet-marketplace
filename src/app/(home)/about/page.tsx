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

export default function Page() {
    return (
        <GeneralShell
            classNames={{
                innerWrapper: "p-0",
            }}
        >
            <div className="bg-[#F9F6F1]">
                <AboutHero />
                <AboutFrustration />
                <AboutCoreValues />
                <AboutMissionVision />
                {/* <Team className="container mx-auto py-20" /> */}
            </div>
        </GeneralShell>
    );
}
