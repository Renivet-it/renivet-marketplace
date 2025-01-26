"use client";

import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    SidebarMenu,
    sidebarMenuButtonVariants,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
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
            <SidebarMenuItem
                className={cn(sidebarMenuButtonVariants({ size: "lg" }))}
            >
                {isPending ? (
                    <>
                        <Skeleton className="size-8 rounded-full" />

                        <div className="grid flex-1 gap-px text-left text-sm leading-tight">
                            <Skeleton className="h-4 w-20 rounded-lg" />
                            <Skeleton className="h-3 w-16 rounded-lg" />
                        </div>
                    </>
                ) : (
                    <>
                        <Avatar className="size-8">
                            <AvatarImage
                                src={user?.avatarUrl ?? DEFAULT_AVATAR_URL}
                                alt={user?.firstName}
                            />
                            <AvatarFallback>
                                {user?.firstName[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">
                                {user?.firstName} {user?.lastName}
                            </span>
                            <span className="truncate text-xs">
                                {hideEmail(user!.email)}
                            </span>
                        </div>
                    </>
                )}

                <button
                    className="disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoggingOut}
                    onClick={() => handleLogout()}
                >
                    <Icons.LogOut className="ml-auto size-4" />
                    <span className="sr-only">Log out</span>
                </button>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
