import { auditLogQueries } from "@/lib/db/queries";

export async function AuditHistoryPanel({
    entityType,
    entityId,
}: {
    entityType: string;
    entityId: string;
}) {
    const logs = await auditLogQueries.list({ entityType, entityId, limit: 8 });

    return (
        <section className="rounded-md border bg-background">
            <div className="border-b px-4 py-3">
                <h2 className="text-base font-semibold">History</h2>
                <p className="text-sm text-muted-foreground">
                    Audit trail for this record
                </p>
            </div>
            <div className="divide-y">
                {logs.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground">
                        No audit history yet.
                    </p>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className="grid gap-1 px-4 py-3 text-sm"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-medium">
                                    {log.actionType}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {log.timestampUtc.toISOString()}
                                </span>
                            </div>
                            <p className="text-muted-foreground">
                                {log.reason ?? "No reason recorded"} by{" "}
                                {log.userId ?? "system"}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
