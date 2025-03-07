"use client";

import { UserRoleManageForm } from "@/components/globals/forms";
import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { DEFAULT_AVATAR_URL } from "@/config/const";
import { cn, convertValueToLabel, hideEmail } from "@/lib/utils";
import { toast } from "sonner";
import { TableUser } from "./users-table";

interface PageProps {
    user: TableUser;
}

export function UserAction({ user }: PageProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="size-8 p-0">
                    <Icons.Settings2 className="size-4" />
                    <span className="sr-only">Actions</span>
                </Button>
            </SheetTrigger>

            <SheetContent className="space-y-4 p-4">
                <SheetHeader>
                    <SheetTitle className="sr-only hidden">
                        User Actions
                    </SheetTitle>

                    <div className="flex items-center gap-2 text-start">
                        <Avatar>
                            <AvatarImage
                                src={user.avatarUrl ?? DEFAULT_AVATAR_URL}
                                alt={user.name}
                            />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>

                        <div>
                            <p className="text-sm font-semibold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {hideEmail(user.email)}
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="grid grid-cols-3 items-center divide-x">
                    {Object.entries({
                        id: user.id,
                        email: user.email,
                        phone: user.phone,
                    }).map(([key, value]) => {
                        const Icon =
                            key === "email"
                                ? Icons.Mail
                                : key === "phone"
                                  ? Icons.Phone
                                  : Icons.User;

                        return (
                            <button
                                className="flex flex-col items-center gap-1 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:text-foreground/50"
                                key={key}
                                disabled={!value}
                                onClick={() => {
                                    navigator.clipboard.writeText(value!);
                                    return toast.success(
                                        `${convertValueToLabel(
                                            key
                                        )} copied to clipboard`
                                    );
                                }}
                            >
                                <Icon
                                    className={cn(
                                        "size-4",
                                        !value && "text-foreground/50"
                                    )}
                                />
                                Copy {convertValueToLabel(key)}
                            </button>
                        );
                    })}
                </div>

                <Separator />

                <div className="space-y-4 text-sm">
                    <div className="space-y-2">
                        <p>Addresses</p>

                        {!!user.addresses.length ? (
                            user.addresses
                                .sort((a) => (a.isPrimary ? -1 : 1))
                                .map((address) => (
                                    <div
                                        key={address.id}
                                        className="space-y-1 rounded-md bg-muted p-4"
                                    >
                                        <div>
                                            <div className="flex justify-between gap-2">
                                                <p className="font-semibold">
                                                    {address.fullName} (
                                                    {convertValueToLabel(
                                                        address.type
                                                    )}
                                                    )
                                                </p>

                                                {address.isPrimary && (
                                                    <Badge
                                                        className="text-xs"
                                                        variant="secondary"
                                                    >
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>
                                            <p
                                                className="cursor-pointer text-xs underline"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(
                                                        address.phone
                                                    );
                                                    return toast.success(
                                                        "Phone number copied to clipboard"
                                                    );
                                                }}
                                            >
                                                {address.phone}
                                            </p>
                                        </div>

                                        <div>
                                            <p>{address.alias}</p>
                                            <p>
                                                {address.city}, {address.state}{" "}
                                                {address.zip}
                                            </p>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="space-y-1 rounded-md bg-muted p-4">
                                <p>No address found</p>
                            </div>
                        )}
                    </div>
                </div>

                <UserRoleManageForm user={user} type="site" />
            </SheetContent>
        </Sheet>
    );
}
