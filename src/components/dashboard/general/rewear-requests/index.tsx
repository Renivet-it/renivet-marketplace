import type { RewearPickupRequest } from "@/lib/validations";

export function RewearRequestsTable({
    data,
    count,
}: {
    data: RewearPickupRequest[];
    count: number;
}) {
    return <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{count} pickup request{count === 1 ? "" : "s"} submitted</p>
        <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-4">Submitted</th><th className="p-4">Name</th><th className="p-4">Mobile</th><th className="p-4">Locality / PIN</th><th className="p-4">Garments</th><th className="p-4">Contact</th><th className="p-4">Notes</th></tr></thead>
                <tbody>{data.length ? data.map((request) => <tr key={request.id} className="border-b last:border-0"><td className="p-4 whitespace-nowrap">{request.createdAt.toLocaleDateString()}</td><td className="p-4 font-medium">{request.fullName}</td><td className="p-4">{request.mobileNumber}</td><td className="p-4">{request.locality}</td><td className="p-4">{request.garmentCount}</td><td className="p-4">{request.contactMethod}</td><td className="max-w-[220px] p-4 text-muted-foreground">{request.categoryNote || "—"}</td></tr>) : <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No Rewear pickup requests yet.</td></tr>}</tbody>
            </table>
        </div>
    </div>;
}
