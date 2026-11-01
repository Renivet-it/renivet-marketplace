import type { RewearPickupRequest } from "@/lib/validations";

export function RewearRequestsTable({
    data,
    count,
}: {
    data: RewearPickupRequest[];
    count: number;
}) {
    return (
        <div className="w-full min-w-0 space-y-4">
            <p className="text-sm text-muted-foreground">
                {count} pickup request{count === 1 ? "" : "s"} submitted
            </p>

            <p className="text-xs text-muted-foreground sm:hidden">
                Swipe the table sideways to see all request details.
            </p>

            <div
                aria-label="Rewear pickup requests table. Scroll horizontally to see all columns."
                className="w-full min-w-0 max-w-full overflow-x-scroll overscroll-x-contain rounded-lg border bg-card"
                role="region"
                tabIndex={0}
            >
                <table className="w-full min-w-[900px] text-sm">
                    <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                            <th className="p-4">Submitted</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Mobile</th>
                            <th className="p-4">Locality / PIN</th>
                            <th className="p-4">Garments</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length ? (
                            data.map((request) => (
                                <tr
                                    key={request.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="whitespace-nowrap p-4">
                                        {request.createdAt.toLocaleDateString()}
                                    </td>
                                    <td className="p-4 font-medium">
                                        {request.fullName}
                                    </td>
                                    <td className="p-4">
                                        {request.mobileNumber}
                                    </td>
                                    <td className="p-4">
                                        {request.locality}
                                    </td>
                                    <td className="p-4">
                                        {request.garmentCount}
                                    </td>
                                    <td className="p-4">
                                        {request.contactMethod}
                                    </td>
                                    <td className="max-w-[220px] p-4 text-muted-foreground">
                                        {request.categoryNote || "—"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="p-12 text-center text-muted-foreground"
                                >
                                    No Rewear pickup requests yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
