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

const actorTypeOptions = ["admin", "system", "brand", "customer"] as const;
const pageSize = 20;

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

function formatLabel(value?: string | null) {
    if (!value) return "-";
    return value
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toSingleValue(value?: string | string[]) {
    return typeof value === "string" ? value : undefined;
}

function buildQueryString(
    params: Record<string, string | undefined>,
    overrides: Record<string, string | undefined> = {}
) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({
        ...params,
        ...overrides,
    })) {
        if (value) query.set(key, value);
    }
    return query.toString();
}

function getPageNumbers(currentPage: number, totalPages: number) {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default async function FinanceAuditLogPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    await assertFinanceModulePageAccess("audit_log_finance");
    const params = await searchParams;

    const rawEntityType = toSingleValue(params.entityType);
    const rawEntityId = toSingleValue(params.entityId);
    const rawActionType = toSingleValue(params.actionType);
    const rawActorId = toSingleValue(params.actorId);
    const rawActorType = toSingleValue(params.actorType);
    const rawFrom = toSingleValue(params.from);
    const rawTo = toSingleValue(params.to);
    const rawQ = toSingleValue(params.q);
    const rawPage = Number(toSingleValue(params.page) ?? "1");

    const entityType = rawEntityType?.trim() || undefined;
    const entityId = rawEntityId?.trim() || undefined;
    const actionType = rawActionType?.trim() || undefined;
    const actorId = rawActorId?.trim() || undefined;
    const actorType = rawActorType?.trim() || undefined;
    const from = parseDate(rawFrom);
    const to = parseDate(rawTo);
    const q = rawQ?.trim() || undefined;
    const attachmentOnly = params.attachmentOnly === "true";
    const requestedPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

    const auditPage = await financeComplianceQueries.getFinanceAuditLogsPage({
        entityType,
        entityId,
        actionType,
        actorId,
        actorType,
        from,
        to,
        q,
        attachmentOnly,
        page: requestedPage,
        pageSize,
    });

    const logs = auditPage.rows;
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

    const baseQueryParams = {
        entityType,
        entityId,
        actionType,
        actorId,
        actorType,
        q,
        from: rawFrom,
        to: rawTo,
        attachmentOnly: attachmentOnly ? "true" : undefined,
    };
    const exportQuery = buildQueryString(baseQueryParams);
    const clearFiltersHref = "/dashboard/general/finance/audit-log";
    const pageNumbers = getPageNumbers(auditPage.page, auditPage.totalPages);
    const updateActionCount = logs.filter((log) =>
        ["updated", "approved", "rejected", "locked", "unlocked", "overridden", "written_off"].includes(
            log.actionType
        )
    ).length;
    const attachmentCount = logs.filter((log) => Boolean(log.attachmentUrl)).length;

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_35%),linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(241,245,249,0.98))] p-4 sm:p-6">
            <div className="mx-auto max-w-7xl space-y-5">
                <header className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                    <div className="grid gap-6 p-6 lg:grid-cols-[1.8fr_1fr] lg:p-8">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">M10</p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                                Finance Audit Log
                            </h1>
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                                This page is the finance evidence trail. Every key action across refunds, COD,
                                payouts, GST, TDS, privacy requests, legal contact updates, and P&amp;L changes lands
                                here with actor, timestamp, before/after snapshot, and proof file when available.
                            </p>
                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Entity Type
                                    </p>
                                    <p className="mt-2 text-sm text-slate-700">
                                        Which finance object changed, such as `refund`, `payout`, `cod_reconciliation`,
                                        `p_and_l_entry`, or `legal_contact`.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Action
                                    </p>
                                    <p className="mt-2 text-sm text-slate-700">
                                        What happened: created, updated, approved, rejected, executed, locked,
                                        unlocked, exported, written off, or overridden.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        JSON Diff
                                    </p>
                                    <p className="mt-2 text-sm text-slate-700">
                                        Open a row to compare `previous value` and `new value`. That is the audit proof
                                        of what exactly changed.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                                    Audit Rules
                                </p>
                                <p className="mt-3 text-sm leading-6 text-slate-200">
                                    This UI is append-only. There is no delete or void button here. If a business event
                                    changes again, a new audit row is created instead of editing the old one.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-white/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Rows found</p>
                                    <p className="mt-2 text-3xl font-semibold">{auditPage.total}</p>
                                </div>
                                <div className="rounded-2xl bg-white/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">This page</p>
                                    <p className="mt-2 text-3xl font-semibold">
                                        {auditPage.page}/{auditPage.totalPages}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visible rows</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-950">{logs.length}</p>
                        <p className="mt-2 text-sm text-slate-500">Current page size is {pageSize} rows.</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Attachments</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-950">{attachmentCount}</p>
                        <p className="mt-2 text-sm text-slate-500">Proof-backed records shown on this page.</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Change events</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-950">{updateActionCount}</p>
                        <p className="mt-2 text-sm text-slate-500">Updates, approvals, locks, overrides, and write-offs.</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">How to read</p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Start with the summary row, then open it to inspect reason, actor, proof link, and full
                            before/after JSON.
                        </p>
                    </div>
                </section>

                <form className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-950">Filter and export</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Narrow the audit trail by module object, action, actor, date, record ID, or proof
                                availability.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white">
                                Apply filters
                            </button>
                            <a
                                href={clearFiltersHref}
                                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700"
                            >
                                Clear filters
                            </a>
                            <a
                                href={`/api/finance/audit-log/export${exportQuery ? `?${exportQuery}` : ""}`}
                                className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 px-5 text-sm font-semibold text-emerald-800"
                            >
                                Export CSV
                            </a>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                            Entity type
                            <input
                                name="entityType"
                                defaultValue={entityType}
                                placeholder="refund, payout, p_and_l_entry"
                                className="h-11 rounded-2xl border border-slate-300 px-3 text-sm font-normal text-slate-900"
                            />
                            <span className="text-xs font-normal text-slate-500">Which finance object changed.</span>
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                            Entity ID
                            <input
                                name="entityId"
                                defaultValue={entityId}
                                placeholder="Paste exact record ID"
                                className="h-11 rounded-2xl border border-slate-300 px-3 text-sm font-normal text-slate-900"
                            />
                            <span className="text-xs font-normal text-slate-500">Useful when tracing one record.</span>
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                            Action
                            <input
                                name="actionType"
                                defaultValue={actionType}
                                placeholder="created, approved, exported"
                                className="h-11 rounded-2xl border border-slate-300 px-3 text-sm font-normal text-slate-900"
                            />
                            <span className="text-xs font-normal text-slate-500">What happened to the record.</span>
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                            Actor ID
                            <input
                                name="actorId"
                                defaultValue={actorId}
                                placeholder="Clerk user ID"
                                className="h-11 rounded-2xl border border-slate-300 px-3 text-sm font-normal text-slate-900"
                            />
                            <span className="text-xs font-normal text-slate-500">Who performed the action.</span>
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                            Actor type
                            <select
                                name="actorType"
                                defaultValue={actorType ?? ""}
                                className="h-11 rounded-2xl border border-slate-300 px-3 text-sm font-normal text-slate-900"
                            >
                                <option value="">All actor types</option>
                                {actorTypeOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {formatLabel(option)}
                                    </option>
                                ))}
                            </select>
                            <span className="text-xs font-normal text-slate-500">
                                Admin, system, brand, or customer.
                            </span>
                        </label>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_2fr_auto]">
                        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                            From date
                            <input
                                name="from"
                                type="date"
                                defaultValue={rawFrom}
                                className="h-11 rounded-2xl border border-slate-300 px-3 text-sm font-normal text-slate-900"
                            />
                            <span className="text-xs font-normal text-slate-500">Beginning of audit window.</span>
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                            To date
                            <input
                                name="to"
                                type="date"
                                defaultValue={rawTo}
                                className="h-11 rounded-2xl border border-slate-300 px-3 text-sm font-normal text-slate-900"
                            />
                            <span className="text-xs font-normal text-slate-500">End of audit window.</span>
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                            Search
                            <input
                                name="q"
                                defaultValue={q}
                                placeholder="Search reason, entity id, action, or finance event code"
                                className="h-11 rounded-2xl border border-slate-300 px-3 text-sm font-normal text-slate-900"
                            />
                            <span className="text-xs font-normal text-slate-500">
                                Free-text scan across the most-used audit fields.
                            </span>
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 md:self-start">
                            <input
                                type="checkbox"
                                name="attachmentOnly"
                                value="true"
                                defaultChecked={attachmentOnly}
                                className="size-4 rounded border-slate-300"
                            />
                            Proof attachments only
                        </label>
                    </div>
                </form>

                <section className="space-y-3">
                    {logs.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-sm">
                            No finance audit rows matched the current filters.
                        </div>
                    ) : (
                        logs.map((log) => {
                            const actorDisplay =
                                actorMap.get(log.userId ?? "") ??
                                log.userId ??
                                formatLabel(log.actorType) ??
                                "System";
                            const eventCode = String(
                                (log.metadata as Record<string, unknown> | null)?.financeEventCode ?? log.actionType
                            );

                            return (
                                <details
                                    key={log.id}
                                    className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
                                >
                                    <summary className="cursor-pointer list-none p-5">
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[180px_150px_180px_minmax(0,220px)_minmax(0,1fr)]">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                        Timestamp
                                                    </p>
                                                    <p className="mt-2 text-sm font-medium text-slate-700">
                                                        {formatAuditDateTime(log.timestampUtc)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                        Action
                                                    </p>
                                                    <div className="mt-2 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">
                                                        {formatLabel(log.actionType)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                        Entity Type
                                                    </p>
                                                    <p className="mt-2 text-sm font-medium text-slate-800">
                                                        {formatLabel(log.entityType)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                        Entity ID
                                                    </p>
                                                    <p className="mt-2 truncate font-mono text-xs text-slate-600">
                                                        {log.entityId}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                        Actor
                                                    </p>
                                                    <p className="mt-2 text-sm font-medium text-slate-800">{actorDisplay}</p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {formatLabel(log.actorType ?? "system")}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                                    {log.attachmentUrl ? "Proof attached" : "JSON diff only"}
                                                </span>
                                                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                                                    Expand
                                                </span>
                                            </div>
                                        </div>
                                    </summary>

                                    <div className="border-t border-slate-200 bg-slate-50/60 p-5">
                                        <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
                                            <div className="space-y-4">
                                                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                        What this row means
                                                    </p>
                                                    <p className="mt-2 text-sm leading-6 text-slate-700">
                                                        {formatLabel(log.actionType)} was performed on{" "}
                                                        <span className="font-semibold text-slate-900">
                                                            {formatLabel(log.entityType)}
                                                        </span>
                                                        . Use the JSON snapshots to verify exactly what changed before
                                                        and after this event.
                                                    </p>
                                                </div>

                                                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                                                        <div>
                                                            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                Reason
                                                            </dt>
                                                            <dd className="mt-2 leading-6 text-slate-700">
                                                                {log.reason ?? "No explicit reason recorded."}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                Event code
                                                            </dt>
                                                            <dd className="mt-2 break-all text-slate-700">{eventCode}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                Actor ID
                                                            </dt>
                                                            <dd className="mt-2 break-all font-mono text-xs text-slate-700">
                                                                {log.userId ?? "system"}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                Session ID
                                                            </dt>
                                                            <dd className="mt-2 break-all font-mono text-xs text-slate-700">
                                                                {log.sessionId ?? "-"}
                                                            </dd>
                                                        </div>
                                                    </dl>
                                                </div>

                                                {log.attachmentUrl ? (
                                                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                                            Proof attachment
                                                        </p>
                                                        <p className="mt-2 text-sm text-emerald-900">
                                                            This record has an uploaded evidence file linked to it.
                                                        </p>
                                                        <a
                                                            href={log.attachmentUrl}
                                                            target="_blank"
                                                            className="mt-3 inline-flex rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800"
                                                        >
                                                            Open attachment
                                                        </a>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="grid gap-4 xl:grid-cols-2">
                                                <div className="rounded-3xl border border-slate-200 bg-slate-950 p-4">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                                                        Previous value
                                                    </p>
                                                    <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-100">
                                                        {prettyJson(log.beforeValue)}
                                                    </pre>
                                                </div>
                                                <div className="rounded-3xl border border-slate-200 bg-slate-950 p-4">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                                                        New value
                                                    </p>
                                                    <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-100">
                                                        {prettyJson(log.afterValue)}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            );
                        })
                    )}
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Page {auditPage.page} of {auditPage.totalPages}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Showing {logs.length} of {auditPage.total} matching finance audit records.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={`?${buildQueryString(baseQueryParams, {
                                    page: auditPage.page > 1 ? String(auditPage.page - 1) : undefined,
                                })}`}
                                aria-disabled={auditPage.page <= 1}
                                className={`inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold ${
                                    auditPage.page <= 1
                                        ? "pointer-events-none border border-slate-200 bg-slate-100 text-slate-400"
                                        : "border border-slate-300 bg-white text-slate-700"
                                }`}
                            >
                                Previous
                            </a>

                            {pageNumbers.map((pageNumber) => (
                                <a
                                    key={pageNumber}
                                    href={`?${buildQueryString(baseQueryParams, { page: String(pageNumber) })}`}
                                    className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-semibold ${
                                        pageNumber === auditPage.page
                                            ? "bg-slate-950 text-white"
                                            : "border border-slate-300 bg-white text-slate-700"
                                    }`}
                                >
                                    {pageNumber}
                                </a>
                            ))}

                            <a
                                href={`?${buildQueryString(baseQueryParams, {
                                    page:
                                        auditPage.page < auditPage.totalPages
                                            ? String(auditPage.page + 1)
                                            : undefined,
                                })}`}
                                aria-disabled={auditPage.page >= auditPage.totalPages}
                                className={`inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold ${
                                    auditPage.page >= auditPage.totalPages
                                        ? "pointer-events-none border border-slate-200 bg-slate-100 text-slate-400"
                                        : "border border-slate-300 bg-white text-slate-700"
                                }`}
                            >
                                Next
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
