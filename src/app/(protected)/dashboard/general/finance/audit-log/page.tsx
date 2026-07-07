import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";
import { inArray } from "drizzle-orm";

const auditDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
});

function formatAuditDateTime(date: Date) {
    return auditDateTimeFormatter.format(date);
}

function parseDate(value?: string) {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function prettyJson(value: unknown) {
    return JSON.stringify(value ?? {}, null, 2);
}

export default async function FinanceAuditLogPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    await assertFinanceModulePageAccess("audit_log_finance");
    const params = await searchParams;
    const entityType = typeof params.entityType === "string" ? params.entityType : undefined;
    const entityId = typeof params.entityId === "string" ? params.entityId : undefined;
    const actionType = typeof params.actionType === "string" ? params.actionType : undefined;
    const actorId = typeof params.actorId === "string" ? params.actorId : undefined;
    const actorType = typeof params.actorType === "string" ? params.actorType : undefined;
    const from = typeof params.from === "string" ? parseDate(params.from) : undefined;
    const to = typeof params.to === "string" ? parseDate(params.to) : undefined;
    const q = typeof params.q === "string" ? params.q : undefined;
    const attachmentOnly = params.attachmentOnly === "true";

    const logs = await financeComplianceQueries.listFinanceAuditLogs({
        entityType,
        entityId,
        actionType,
        actorId,
        actorType,
        from,
        to,
        q,
        attachmentOnly,
    });

    const actorIds = [
        ...new Set(
            logs
                .map((log) => log.userId)
                .filter((userId): userId is string => Boolean(userId?.startsWith("user_")))
        ),
    ];
    const actorRows = actorIds.length
        ? await db.query.users.findMany({
              where: inArray(users.id, actorIds),
              columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
              },
          })
        : [];
    const actorMap = new Map(
        actorRows.map((user) => [
            user.id,
            `${user.firstName} ${user.lastName}`.trim() || user.email,
        ])
    );

    const exportQuery = new URLSearchParams();
    for (const [key, value] of Object.entries({
        entityType,
        entityId,
        actionType,
        actorId,
        actorType,
        q,
        from: typeof params.from === "string" ? params.from : undefined,
        to: typeof params.to === "string" ? params.to : undefined,
        attachmentOnly: attachmentOnly ? "true" : undefined,
    })) {
        if (value) exportQuery.set(key, value);
    }

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-7xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">M10</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">Finance Audit Log</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Append-only finance and compliance evidence with structured before/after snapshots, actor typing,
                        and proof attachments.
                    </p>
                    <p className="mt-3 text-sm text-slate-500">No delete or void action exists in this UI.</p>
                </header>

                <form className="grid gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-3 xl:grid-cols-5">
                    <label className="grid gap-1.5 text-sm font-medium">
                        Entity type
                        <input name="entityType" defaultValue={entityType} className="h-10 rounded-md border px-3 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Entity ID
                        <input name="entityId" defaultValue={entityId} className="h-10 rounded-md border px-3 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Action
                        <input name="actionType" defaultValue={actionType} className="h-10 rounded-md border px-3 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Actor ID
                        <input name="actorId" defaultValue={actorId} className="h-10 rounded-md border px-3 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Actor type
                        <input name="actorType" defaultValue={actorType} className="h-10 rounded-md border px-3 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        From
                        <input name="from" type="date" defaultValue={typeof params.from === "string" ? params.from : undefined} className="h-10 rounded-md border px-3 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        To
                        <input name="to" type="date" defaultValue={typeof params.to === "string" ? params.to : undefined} className="h-10 rounded-md border px-3 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium md:col-span-2">
                        Search
                        <input name="q" defaultValue={q} className="h-10 rounded-md border px-3 text-sm font-normal" />
                    </label>
                    <label className="flex items-end gap-2 text-sm font-medium">
                        <input type="checkbox" name="attachmentOnly" value="true" defaultChecked={attachmentOnly} />
                        Proof attachments only
                    </label>
                    <div className="flex items-end gap-2 md:col-span-3 xl:col-span-5">
                        <button className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">
                            Apply filters
                        </button>
                        <a
                            href={`/api/finance/audit-log/export${exportQuery.toString() ? `?${exportQuery.toString()}` : ""}`}
                            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold text-slate-700"
                        >
                            Export CSV
                        </a>
                    </div>
                </form>

                <section className="space-y-3">
                    {logs.length === 0 ? (
                        <div className="rounded-md border bg-white p-6 text-sm text-slate-500 shadow-sm">
                            No finance audit rows found for the selected filters.
                        </div>
                    ) : (
                        logs.map((log) => (
                            <details key={log.id} className="rounded-md border bg-white shadow-sm">
                                <summary className="grid cursor-pointer gap-3 px-4 py-3 text-sm md:grid-cols-[180px_140px_180px_180px_1fr_auto]">
                                    <span className="text-slate-500">{formatAuditDateTime(log.timestampUtc)}</span>
                                    <span className="font-semibold text-slate-900">{log.actionType}</span>
                                    <span className="text-slate-700">{log.entityType}</span>
                                    <span className="truncate text-slate-500">{log.entityId}</span>
                                    <span className="truncate text-slate-500">
                                        {actorMap.get(log.userId ?? "") ?? log.userId ?? log.actorType ?? "system"}
                                    </span>
                                    <span className="text-right text-xs text-slate-500">
                                        {log.attachmentUrl ? "Attachment" : "JSON diff"}
                                    </span>
                                </summary>
                                <div className="grid gap-4 border-t p-4 lg:grid-cols-2">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">Reason</p>
                                            <p className="mt-1 text-sm text-slate-700">{log.reason ?? "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">Actor</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {log.userId ?? "system"} · {log.actorType ?? "system"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">Event code</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {String((log.metadata as Record<string, unknown> | null)?.financeEventCode ?? log.actionType)}
                                            </p>
                                        </div>
                                        {log.attachmentUrl ? (
                                            <div>
                                                <p className="text-xs font-semibold uppercase text-slate-500">Proof attachment</p>
                                                <a href={log.attachmentUrl} target="_blank" className="mt-1 inline-flex text-sm font-medium text-emerald-700">
                                                    Open attachment
                                                </a>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-3 lg:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">Previous value</p>
                                            <pre className="mt-1 max-h-72 overflow-auto rounded-md bg-slate-950/95 p-3 text-xs text-slate-100">
                                                {prettyJson(log.beforeValue)}
                                            </pre>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">New value</p>
                                            <pre className="mt-1 max-h-72 overflow-auto rounded-md bg-slate-950/95 p-3 text-xs text-slate-100">
                                                {prettyJson(log.afterValue)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        ))
                    )}
                </section>
            </div>
        </main>
    );
}
