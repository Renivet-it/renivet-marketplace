"use client";

import { useParams, useSearchParams } from "next/navigation";
import { AdminSupportPage } from "../../page";

export default function SupportCaseWorkspacePage() {
    const params = useParams<{ ticketId: string }>();
    const searchParams = useSearchParams();
    const queueParam = searchParams.get("queue");
    const initialQueue =
        queueParam === "brand"
            ? "brand"
            : queueParam === "grievance"
              ? "grievance"
              : "user";

    return (
        <AdminSupportPage
            caseId={params.ticketId}
            initialQueue={initialQueue}
            standalone
        />
    );
}
