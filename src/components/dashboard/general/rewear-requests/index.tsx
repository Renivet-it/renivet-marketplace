import type { RewearPickupRequest } from "@/lib/validations";

export function RewearRequestsTable({
    data,
    count,
}: {
    data: RewearPickupRequest[];
    count: number;
}) {
    return (
        <div className="min-w-0 space-y-4">
            <p className="text-sm text-muted-foreground">
                {count} pickup request{count === 1 ? "" : "s"} submitted
            </p>

            <div className="space-y-3 xl:hidden">
                {data.length ? (
                    data.map((request) => (
                        <article
                            key={request.id}
                            className="min-w-0 rounded-lg border bg-card p-4"
                        >
                            <div className="flex min-w-0 items-start justify-between gap-3 border-b pb-3">
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                        Name
                                    </p>
                                    <p className="break-words font-medium">
                                        {request.fullName}
                                    </p>
                                </div>
                                <time className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                                    {request.createdAt.toLocaleDateString()}
                                </time>
                            </div>

                            <dl className="mt-3 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                <div className="min-w-0">
                                    <dt className="text-xs text-muted-foreground">
                                        Mobile
                                    </dt>
                                    <dd className="break-all">
                                        {request.mobileNumber}
                                    </dd>
                                </div>
                                <div className="min-w-0">
                                    <dt className="text-xs text-muted-foreground">
                                        Locality / PIN
                                    </dt>
                                    <dd className="break-words">
                                        {request.locality}
                                    </dd>
                                </div>
                                <div className="min-w-0">
                                    <dt className="text-xs text-muted-foreground">
                                        Garments
                                    </dt>
                                    <dd className="break-words">
                                        {request.garmentCount}
                                    </dd>
                                </div>
                                <div className="min-w-0">
                                    <dt className="text-xs text-muted-foreground">
                                        Contact
                                    </dt>
                                    <dd className="break-words">
                                        {request.contactMethod}
                                    </dd>
                                </div>
                                <div className="col-span-2 min-w-0">
                                    <dt className="text-xs text-muted-foreground">
                                        Notes
                                    </dt>
                                    <dd className="break-words text-muted-foreground">
                                        {request.categoryNote || "—"}
                                    </dd>
                                </div>
                            </dl>
                        </article>
                    ))
                ) : (
                    <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
                        No Rewear pickup requests yet.
                    </p>
                )}
            </div>

            <div className="hidden overflow-hidden rounded-lg border bg-card xl:block">
                <table className="w-full table-fixed text-sm">
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
                                    <td className="break-words p-4 align-top">
                                        {request.createdAt.toLocaleDateString()}
                                    </td>
                                    <td className="break-words p-4 align-top font-medium">
                                        {request.fullName}
                                    </td>
                                    <td className="break-all p-4 align-top">
                                        {request.mobileNumber}
                                    </td>
                                    <td className="break-words p-4 align-top">
                                        {request.locality}
                                    </td>
                                    <td className="break-words p-4 align-top">
                                        {request.garmentCount}
                                    </td>
                                    <td className="break-words p-4 align-top">
                                        {request.contactMethod}
                                    </td>
                                    <td className="break-words p-4 align-top text-muted-foreground">
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
