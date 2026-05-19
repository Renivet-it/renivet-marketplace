"use client";

import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Bell, CheckCheck, Dot } from "lucide-react";
import { useEffect, useState } from "react";

function buildSupportDisplayTitle(input: {
    title?: string | null;
    issueLabel?: string | null;
    issueType?: string | null;
    orderId?: string | null;
}) {
    const baseLabel =
        input.issueLabel?.trim() ||
        input.title
            ?.replace(/\s*\(Order #.+\)\s*$/i, "")
            .replace(/\s*for order\s+.+$/i, "")
            .trim() ||
        input.issueType?.replace(/_/g, " ").trim() ||
        "Support request";

    return input.orderId ? `${baseLabel} (Order #${input.orderId})` : baseLabel;
}

function buildNotificationBody(notification: any) {
    const supportTicket = notification.supportTicket;
    if (!supportTicket) return notification.body;

    const displayTitle = buildSupportDisplayTitle({
        title: supportTicket.title,
        issueLabel: supportTicket.issueLabel,
        issueType: supportTicket.issueType,
        orderId: supportTicket.orderId,
    });

    if (notification.type === "support.ticket.status_changed") {
        const status =
            typeof notification.metadata?.status === "string"
                ? notification.metadata.status.replace(/_/g, " ")
                : null;

        return status
            ? `"${displayTitle}" is now ${status}`
            : `Your support case "${displayTitle}" was updated`;
    }

    if (notification.type === "support.ticket.reply") {
        return `Our support team replied to "${displayTitle}"`;
    }

    return notification.body;
}

function buildNotificationTag(notification: any) {
    if (notification.type?.startsWith("support.ticket")) {
        return "Support";
    }

    if (notification.type?.includes("coupon")) {
        return "Coupon";
    }

    return "Update";
}

export function NotificationsPage() {
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const notificationsQuery = trpc.general.notifications.list.useQuery({
        limit: pageSize,
        page,
        unreadOnly: filter === "unread" ? true : undefined,
    });
    const markReadMutation = trpc.general.notifications.markRead.useMutation({
        onSuccess: () => notificationsQuery.refetch(),
    });
    const markAllReadMutation =
        trpc.general.notifications.markAllRead.useMutation({
            onSuccess: () => notificationsQuery.refetch(),
        });

    useEffect(() => {
        setPage(1);
    }, [filter]);

    const queryPayload = notificationsQuery.data;
    const notifications = Array.isArray(queryPayload)
        ? queryPayload
        : (queryPayload?.data ?? []);
    const totalCount = Array.isArray(queryPayload)
        ? queryPayload.length
        : (queryPayload?.totalCount ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const unreadCount = notifications.filter(
        (notification) => !notification.readAt
    ).length;

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-[#F7FBFF] to-[#EEF5FF] p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE3F8] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                            <Bell className="size-3.5" />
                            Notifications
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                            Keep track of support updates
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Replies, status changes, dispute approvals, and
                            coupon updates will appear here.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                    >
                        <CheckCheck className="mr-2 size-4" />
                        Mark all as read
                    </Button>
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                            <button
                                type="button"
                                onClick={() => setFilter("all")}
                                className={cn(
                                    "rounded-full px-4 py-2 text-sm font-medium transition",
                                    filter === "all"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilter("unread")}
                                className={cn(
                                    "rounded-full px-4 py-2 text-sm font-medium transition",
                                    filter === "unread"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                Unread
                            </button>
                        </div>
                        <p className="text-sm text-slate-500">
                            {filter === "unread"
                                ? `${unreadCount} unread notification${
                                      unreadCount === 1 ? "" : "s"
                                  }`
                                : `${totalCount} notification${
                                      totalCount === 1 ? "" : "s"
                                  }`}
                        </p>
                    </div>
                    <p className="text-sm text-slate-500">
                        Click a notification to mark it as read.
                    </p>
                </div>

                <div className="mt-5 space-y-3">
                    {notificationsQuery.error && (
                        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
                            Failed to load notifications. Please refresh the
                            page.
                        </div>
                    )}

                    {notifications.length === 0 && (
                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                            {filter === "unread"
                                ? "No unread notifications."
                                : "No notifications yet."}
                        </div>
                    )}

                    {notifications.map((notification) => {
                        const isUnread = !notification.readAt;
                        return (
                            <button
                                key={notification.id}
                                type="button"
                                className={cn(
                                    "block w-full rounded-[24px] border p-5 text-left transition",
                                    isUnread
                                        ? "border-[#BFD8F0] bg-[#F7FBFF] hover:bg-[#F2F8FF]"
                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                )}
                                onClick={() => {
                                    if (isUnread) {
                                        markReadMutation.mutate({
                                            id: notification.id,
                                        });
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {isUnread && (
                                                <Dot className="size-5 text-[#5B9BD5]" />
                                            )}
                                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                {buildNotificationTag(
                                                    notification
                                                )}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {format(
                                                    new Date(
                                                        notification.createdAt
                                                    ),
                                                    "dd MMM yyyy, hh:mm a"
                                                )}
                                            </span>
                                        </div>

                                        <p className="mt-3 text-base font-semibold text-slate-900">
                                            {notification.title}
                                        </p>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                            {buildNotificationBody(
                                                notification
                                            )}
                                        </p>
                                    </div>

                                    <div className="shrink-0">
                                        {isUnread ? (
                                            <span className="rounded-full bg-[#5B9BD5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                                                Unread
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Read
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {totalCount > pageSize && (
                    <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() =>
                                    setPage((current) => current - 1)
                                }
                                disabled={
                                    page === 1 || notificationsQuery.isFetching
                                }
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() =>
                                    setPage((current) => current + 1)
                                }
                                disabled={
                                    page >= totalPages ||
                                    notificationsQuery.isFetching
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
