"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_AVATAR_URL } from "@/config/const";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { trpc } from "@/lib/trpc/client";
import { handleClientError, hideEmail, wait } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useMutation } from "@tanstack/react-query";
import {
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    CreditCard,
    LogOut,
    Sparkles,
} from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";

export function NavUser() {
    const { isMobile } = useSidebar();

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
                <DropdownMenu>
                    <DropdownMenuTrigger disabled={isPending} asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
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
                                            src={
                                                user?.avatarUrl ??
                                                DEFAULT_AVATAR_URL
                                            }
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

                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    {!!user && (
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="size-8">
                                        <AvatarImage
                                            src={
                                                user?.avatarUrl ??
                                                DEFAULT_AVATAR_URL
                                            }
                                            alt={user?.firstName}
                                        />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>

                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {user?.firstName} {user?.lastName}
                                        </span>
                                        <span className="truncate text-xs">
                                            {hideEmail(user!.email)}
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <DropdownMenuGroup>
                                <DropdownMenuItem disabled>
                                    <Sparkles />
                                    Upgrade to Pro
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuGroup>
                                <DropdownMenuItem disabled>
                                    <BadgeCheck />
                                    Account
                                </DropdownMenuItem>

                                <DropdownMenuItem disabled>
                                    <CreditCard />
                                    Billing
                                </DropdownMenuItem>

                                <DropdownMenuItem disabled>
                                    <Bell />
                                    Notifications
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                disabled={isLoggingOut}
                                onClick={() => handleLogout()}
                            >
                                <LogOut />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    )}
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
