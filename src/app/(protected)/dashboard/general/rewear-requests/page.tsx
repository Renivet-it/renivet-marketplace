import { RewearRequestsTable } from "@/components/dashboard/general/rewear-requests";
import { DashShell } from "@/components/globals/layouts";
import { rewearPickupQueries } from "@/lib/db/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rewear Pickup Requests", description: "View Rewear pickup requests submitted by customers." };

export default async function RewearRequestsPage() {
    const result = await rewearPickupQueries.list({ limit: 100, page: 1 });
    return <DashShell className="max-w-none"><div className="mb-6 space-y-1"><h1 className="text-2xl font-bold">Rewear Pickup Requests</h1><p className="text-sm text-muted-foreground">Review the customer details submitted through the Rewear pickup form.</p></div><RewearRequestsTable data={result.data} count={result.count} /></DashShell>;
}
