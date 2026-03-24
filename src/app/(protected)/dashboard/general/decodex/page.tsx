import { DecodeXPage, DecodeXTable } from "@/components/dashboard/general/decodex";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "DecodeX Profiles",
    description: "Manage brand and sub-category level DecodeX transparency data",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">DecodeX Profiles</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage Product Journey and Story fields at brand and sub-category level.
                    </p>
                </div>

                <DecodeXPage />
            </div>

            <DecodeXTable />
        </DashShell>
    );
}
