import type { RewearPickupRequest } from "@/lib/validations";
import Link from "next/link";

export function RewearRequestsTable({
    data,
    count,
    page,
    pageSize,
}: {
    data: RewearPickupRequest[];
    count: number;
    page: number;
    pageSize: number;
}) {
    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    const pageHref = (targetPage: number) =>
        targetPage === 1
            ? "/dashboard/general/rewear-requests"
            : `/dashboard/general/rewear-requests?page=${targetPage}`;
    const rangeStart = count === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, count);

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
                className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-lg border bg-white"
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

            <nav
                aria-label="Rewear pickup requests pagination"
                className="flex flex-wrap items-center justify-between gap-3 text-sm"
            >
                <p className="text-muted-foreground">
                    Showing {rangeStart}–{rangeEnd} of {count}
                </p>
                <div className="flex items-center gap-2">
                    {page > 1 ? (
                        <Link
                            href={pageHref(page - 1)}
                            className="rounded-md border px-3 py-2 hover:bg-accent"
                        >
                            Previous
                        </Link>
                    ) : (
                        <span className="rounded-md border px-3 py-2 text-muted-foreground" aria-disabled="true">
                            Previous
                        </span>
                    )}
                    <span className="text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    {page < totalPages ? (
                        <Link
                            href={pageHref(page + 1)}
                            className="rounded-md border px-3 py-2 hover:bg-accent"
                        >
                            Next
                        </Link>
                    ) : (
                        <span className="rounded-md border px-3 py-2 text-muted-foreground" aria-disabled="true">
                            Next
                        </span>
                    )}
                </div>
            </nav>
        </div>
    );
}
