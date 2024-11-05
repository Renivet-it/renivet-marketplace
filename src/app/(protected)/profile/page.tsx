import { GeneralShell } from "@/components/globals/layouts";
import { GeneralPage, ProfileNav } from "@/components/profile";

export default function Page() {
    return (
        <GeneralShell>
            <div className="space-y-1">
                <h2 className="text-xl font-semibold md:text-3xl">
                    Account Settings
                </h2>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings
                </p>
            </div>

            <div className="flex gap-6">
                <ProfileNav className="h-min basis-1/4" />
                <GeneralPage className="basis-3/4" />
            </div>
        </GeneralShell>
    );
}
