"use client";

import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_AVATAR_URL } from "@/config/const";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { trpc } from "@/lib/trpc/client";
import { cn, handleClientError, hideEmail, wait } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useMutation } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";

export function NavUser() {
    const { data: user, isPending } = trpc.general.users.currentUser.useQuery();
    const { signOut } = useAuth();
    const posthog = usePostHog();

    const { mutate: handleLogout, isPending: isLoggingOut } = useMutation({
        onMutate: () => {
            posthog.capture(POSTHOG_EVENTS.AUTH.SIGNOUT_INITIATED, {
                userId: user?.id,
            });
            const toastId = toast.loading("Logging out...");
            return { toastId };
        },
        mutationFn: () =>
            signOut({
                redirectUrl: "/",
            }),
        onSuccess: async (_, __, { toastId }) => {
            toast.success("See you soon!", { id: toastId });
            posthog.capture(POSTHOG_EVENTS.AUTH.SIGNED_OUT, {
                userId: user?.id,
            });
            await wait(1000);
            window.location.reload();
        },
        onError: (err, _, ctx) => {
            return isClerkAPIResponseError(err)
                ? toast.error(err.errors.map((e) => e.message).join(", "), {
                      id: ctx?.toastId,
                  })
                : handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <div className="flex items-center gap-2 rounded-xl border border-sidebar-border/70 bg-background/60 p-2 shadow-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5">
                    {isPending ? (
                        <>
                            <Skeleton className="size-8 rounded-full" />

                            <div className="grid flex-1 gap-px text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <Skeleton className="h-4 w-20 rounded-lg" />
                                <Skeleton className="h-3 w-16 rounded-lg" />
                            </div>
                        </>
                    ) : (
                        <>
                            <Avatar className="size-8 ring-1 ring-sidebar-border/70">
                                <AvatarImage
                                    src={user?.avatarUrl ?? DEFAULT_AVATAR_URL}
                                    alt={user?.firstName ?? "User"}
                                />
                                <AvatarFallback>
                                    {(user?.firstName?.[0] ?? "U").toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate text-sm font-semibold">
                                    {user?.firstName} {user?.lastName}
                                </span>
                                <span className="truncate text-xs text-sidebar-foreground/65">
                                    {hideEmail(user?.email ?? "")}
                                </span>
                            </div>
                        </>
                    )}

                    <button
                        className={cn(
                            "ml-auto rounded-lg p-2 text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:cursor-not-allowed disabled:opacity-50 group-data-[collapsible=icon]:ml-0",
                            isLoggingOut && "animate-pulse"
                        )}
                        disabled={isLoggingOut}
                        onClick={() => handleLogout()}
                    >
                        <Icons.LogOut className="size-4" />
                        <span className="sr-only">Log out</span>
                    </button>
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
