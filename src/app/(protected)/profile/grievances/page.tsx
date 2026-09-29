import { GrievancesPage } from "@/components/profile";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "My Grievances",
    description: "Track and reply to your grievances",
};

export default function Page() {
    return (
        <div className="min-w-0 flex-1">
            <GrievancesPage />
        </div>
    );
}
