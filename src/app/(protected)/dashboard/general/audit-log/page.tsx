import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import { auditLogQueries } from "@/lib/db/queries";
import { users } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { inArray } from "drizzle-orm";
import { History, Search } from "lucide-react";
import { notFound } from "next/navigation";

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

async function assertAuditAccess() {
    const { userId } = await auth();
    if (!userId) notFound();

    const user = await userCache.get(userId);
    const permissions = user
        ? getUserPermissions(user.roles).sitePermissions
        : 0;
    const allowed = hasPermission(
        permissions,
        [
            BitFieldSitePermission.VIEW_MONITORING,
            BitFieldSitePermission.MANAGE_MONITORING,
            BitFieldSitePermission.ADMINISTRATOR,
        ],
        "any"
    );

    if (!allowed) notFound();
}

export default async function AuditLogPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    await assertAuditAccess();
    const params = await searchParams;
    const entityType =
        typeof params.entityType === "string" ? params.entityType : undefined;
    const entityId =
        typeof params.entityId === "string" ? params.entityId : undefined;
    const actionType =
        typeof params.actionType === "string" ? params.actionType : undefined;
    const q = typeof params.q === "string" ? params.q : undefined;
    const logs = await auditLogQueries.list({
        entityType,
        entityId,
        actionType,
        q,
        limit: 100,
    });
    const actorIds = [
        ...new Set(
            logs
                .map((log) => log.userId)
                .filter((userId): userId is string =>
                    Boolean(userId?.startsWith("user_"))
                )
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
    const getActorLabel = (actorId: string | null) => {
        if (!actorId) return "system";
        if (actorMap.has(actorId)) return actorMap.get(actorId);
        if (actorId === "cron") return "Cron";
        if (actorId.endsWith("-webhook")) return actorId.replaceAll("-", " ");
        return actorId;
    };

    return (
        <main className="min-h-screen bg-slate-50/70 p-4 sm:p-6">
            <div className="mx-auto max-w-[1500px] space-y-4">
                <header className="rounded-md border bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex size-11 items-center justify-center rounded-md bg-slate-950 text-white">
                            <History className="size-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">
                                Monitoring Evidence
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
                                Audit Log
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Append-only operational history for decisions,
                                state changes, overrides, and compliance
                                evidence.
                            </p>
                        </div>
                    </div>
                </header>

                <form className="grid gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-5">
                    <label className="grid gap-1.5 text-sm font-medium">
                        Entity Type
                        <input
                            name="entityType"
                            defaultValue={entityType}
                            className="h-10 rounded-md border px-3 text-sm font-normal"
                        />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Entity ID
                        <input
                            name="entityId"
                            defaultValue={entityId}
                            className="h-10 rounded-md border px-3 text-sm font-normal"
                        />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Action
                        <input
                            name="actionType"
                            defaultValue={actionType}
                            className="h-10 rounded-md border px-3 text-sm font-normal"
                        />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Reason Search
                        <input
                            name="q"
                            defaultValue={q}
                            className="h-10 rounded-md border px-3 text-sm font-normal"
                        />
                    </label>
                    <div className="flex items-end">
                        <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white">
                            <Search className="size-4" />
                            Filter
                        </button>
                    </div>
                </form>

                <section className="overflow-x-auto rounded-md border bg-white shadow-sm">
                    <div className="min-w-[980px]">
                        <div className="grid grid-cols-[190px_minmax(220px,0.9fr)_minmax(260px,1.1fr)_minmax(240px,1fr)_180px] gap-3 border-b bg-slate-100 px-4 py-3 text-xs font-semibold uppercase text-slate-600">
                            <span className="min-w-0">Time (UTC)</span>
                            <span className="min-w-0">Action</span>
                            <span className="min-w-0">Entity</span>
                            <span className="min-w-0">Reason</span>
                            <span className="min-w-0">Actor</span>
                        </div>
                        <div className="divide-y">
                            {logs.length === 0 ? (
                                <p className="p-6 text-sm text-muted-foreground">
                                    No audit rows found.
                                </p>
                            ) : (
                                logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="grid grid-cols-[190px_minmax(220px,0.9fr)_minmax(260px,1.1fr)_minmax(240px,1fr)_180px] gap-3 px-4 py-3 text-sm"
                                    >
                                        <time
                                            dateTime={log.timestampUtc.toISOString()}
                                            className="min-w-0 text-muted-foreground"
                                            title={log.timestampUtc.toISOString()}
                                        >
                                            {formatAuditDateTime(
                                                log.timestampUtc
                                            )}
                                        </time>
                                        <span className="min-w-0 break-all font-medium text-slate-900">
                                            {log.actionType}
                                        </span>
                                        <span className="min-w-0 break-all text-slate-700">
                                            {log.entityType}:{log.entityId}
                                        </span>
                                        <span className="min-w-0 break-words text-muted-foreground">
                                            {log.reason ?? "-"}
                                        </span>
                                        <span className="min-w-0 truncate text-muted-foreground">
                                            {getActorLabel(log.userId) ??
                                                "system"}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
