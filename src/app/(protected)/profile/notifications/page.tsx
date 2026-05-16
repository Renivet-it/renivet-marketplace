import { NotificationsPage } from "@/components/profile";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Notifications",
    description: "View support and account updates",
};

export default function Page() {
    return (
        <div className="min-w-0 flex-1">
            <NotificationsPage />
        </div>
    );
}
