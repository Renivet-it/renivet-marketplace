import { WhatsappNotificationsPage } from "@/components/dashboard/general/whatsapp-notifications/whatsapp-notifications-page";
import { DashShell } from "@/components/globals/layouts";
import { monitoringSlaQueries } from "@/lib/db/queries";
import { roleCache } from "@/lib/redis/methods";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "WhatsApp Notifications",
    description: "Configure role-based WhatsApp delivery for admin modules",
};

export default async function Page() {
    const [roles, settings] = await Promise.all([
        roleCache.getAll(),
        monitoringSlaQueries.getWhatsappNotificationSettings(),
    ]);

    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">WhatsApp Notifications</h1>
                <p className="text-sm text-muted-foreground">
                    Configure module-wise WhatsApp delivery and assign receiver
                    roles.
                </p>
            </div>

            <WhatsappNotificationsPage
                initialRoles={roles.filter((role) => role.isSiteRole)}
                initialSettings={settings}
            />
        </DashShell>
    );
}
