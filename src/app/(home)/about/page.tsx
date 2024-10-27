import { AboutTiles, HowWeWork, Team } from "@/components/about";
import { GeneralShell } from "@/components/globals/layouts";

export default function Page() {
    return (
        <GeneralShell
            classNames={{
                innerWrapper: "space-y-10 md:space-y-20 p-0",
            }}
        >
            <AboutTiles />
            <HowWeWork />
            <Team />
        </GeneralShell>
    );
}