import { AboutTiles } from "@/components/about";
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
                innerWrapper: "space-y-10 md:space-y-20 p-0",
            }}
        >
            <AboutTiles className="mb-10 md:mb-20" />
            {/* <HowWeWork /> */}
            {/* <Team /> */}
        </GeneralShell>
    );
}
