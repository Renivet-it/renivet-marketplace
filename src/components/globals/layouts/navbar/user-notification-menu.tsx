"use client";

import { Button } from "@/components/ui/button-general";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Bell, CheckCheck, Dot } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function notificationTag(type?: string | null) {
    if (type?.startsWith("support.ticket")) return "Support";
    if (type?.includes("reward")) return "Rewards";
    if (type?.includes("coupon")) return "Offers";
    return "Update";
}

function notificationHref(notification: {
    href?: string | null;
    metadata?: Record<string, unknown> | null;
}) {
    if (notification.href) return notification.href;

    const ticketId = notification.metadata?.ticketId;
    if (typeof ticketId === "string" && ticketId.trim().length > 0) {
        return `/profile/help-center/${ticketId}`;
    }

    return "/profile/notifications";
}

export function UserNotificationMenu({
    className,
    align = "end",
}: {
    className?: string;
    align?: "start" | "center" | "end";
}) {
    const router = useRouter();
    const utils = trpc.useUtils();
    const unreadCountQuery = trpc.general.notifications.unreadCount.useQuery();
    const notificationsQuery = trpc.general.notifications.list.useQuery({
        limit: 6,
        page: 1,
    });

    const markReadMutation = trpc.general.notifications.markRead.useMutation({
        onSuccess: async () => {
            await Promise.all([
                utils.general.notifications.list.invalidate(),
                utils.general.notifications.unreadCount.invalidate(),
            ]);
        },
    });

    const markAllReadMutation =
        trpc.general.notifications.markAllRead.useMutation({
            onSuccess: async () => {
                await Promise.all([
                    utils.general.notifications.list.invalidate(),
                    utils.general.notifications.unreadCount.invalidate(),
                ]);
            },
        });

    const unreadCount = unreadCountQuery.data ?? 0;
    const notifications = notificationsQuery.data?.data ?? [];

    const handleOpenNotification = async (notification: {
        id: string;
        readAt?: string | null;
        href?: string | null;
        metadata?: Record<string, unknown> | null;
    }) => {
        if (!notification.readAt) {
            await markReadMutation.mutateAsync({ id: notification.id });
        }

        router.push(notificationHref(notification));
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-transparent bg-transparent text-[#1f2937] transition-all duration-200 hover:border-[#e7dfd1] hover:bg-[#f5f1e8] hover:text-primary",
                        className
                    )}
                    aria-label="Notifications"
                >
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-sm">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                    <Bell className="size-5" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align={align}
                className="w-[360px] rounded-2xl border border-[#e7dfd1] bg-white p-0 shadow-[0_24px_55px_-34px_rgba(15,23,42,0.22)]"
                sideOffset={10}
            >
                <div className="flex items-center justify-between px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Notifications
                        </p>
                        <p className="text-xs text-slate-500">
                            {unreadCount > 0
                                ? `${unreadCount} unread`
                                : "You're all caught up"}
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        className="h-9 rounded-full px-3 text-xs"
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={
                            unreadCount === 0 || markAllReadMutation.isPending
                        }
                    >
                        <CheckCheck className="mr-1.5 size-3.5" />
                        Mark all read
                    </Button>
                </div>

                <DropdownMenuSeparator className="mx-0 my-0 bg-slate-100" />

                <div className="max-h-[420px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-slate-500">
                            No notifications yet.
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            const isUnread = !notification.readAt;

                            return (
                                <button
                                    key={notification.id}
                                    type="button"
                                    onClick={() =>
                                        void handleOpenNotification(notification)
                                    }
                                    className={cn(
                                        "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50",
                                        isUnread && "bg-[#f7fbff]"
                                    )}
                                >
                                    <div className="pt-1">
                                        {isUnread ? (
                                            <Dot className="size-5 text-[#5B9BD5]" />
                                        ) : (
                                            <span className="mt-1 block size-2 rounded-full bg-slate-200" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                {notificationTag(
                                                    notification.type
                                                )}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {format(
                                                    new Date(
                                                        notification.createdAt
                                                    ),
                                                    "dd MMM, hh:mm a"
                                                )}
                                            </span>
                                        </div>

                                        <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900">
                                            {notification.title}
                                        </p>
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                                            {notification.body}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <DropdownMenuSeparator className="mx-0 my-0 bg-slate-100" />

                <div className="flex items-center justify-between px-4 py-3">
                    <p className="text-xs text-slate-500">
                        Open a notification to mark it as read.
                    </p>
                    <Link
                        href="/profile/notifications"
                        className="text-sm font-semibold text-[#5B9BD5] hover:text-[#4a8bc5]"
                    >
                        View all
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
