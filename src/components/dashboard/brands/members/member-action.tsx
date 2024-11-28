"use client";

import { UserRoleManageForm } from "@/components/globals/forms";
import { MemberBanModal, MemberKickModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { trpc } from "@/lib/trpc/client";
import { cn, convertValueToLabel, hideEmail } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { TableMember } from "./members-table";

interface PageProps {
    data: TableMember;
}

export function MemberAction({ data }: PageProps) {
    const [isKickModalOpen, setIsKickModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);

    const { data: currentUser } = trpc.general.users.currentUser.useQuery();

    return (
        <>
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
                                    src={
                                        data.member.avatarUrl ??
                                        DEFAULT_AVATAR_URL
                                    }
                                    alt={data.name}
                                />
                                <AvatarFallback>{data.name[0]}</AvatarFallback>
                            </Avatar>

                            <div>
                                <p className="text-sm font-semibold">
                                    {data.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {hideEmail(data.member.email)}
                                </p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="grid grid-cols-3 items-center divide-x">
                        {Object.entries({
                            id: data.member.id,
                            email: data.member.email,
                            phone: data.member.phone,
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

                    <UserRoleManageForm
                        user={data}
                        type="brand"
                        brandId={data.brandId}
                    />

                    {currentUser && (
                        <>
                            <Separator />

                            <div className="flex items-center gap-2">
                                <Button
                                    className="w-full"
                                    size="sm"
                                    onClick={() => setIsKickModalOpen(true)}
                                    disabled={currentUser.id === data.member.id}
                                >
                                    <Icons.Footprints className="size-4" />
                                    Kick
                                </Button>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setIsBanModalOpen(true)}
                                    disabled={currentUser.id === data.member.id}
                                >
                                    <Icons.Hammer className="size-4" />
                                    Ban
                                </Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <MemberKickModal
                data={data}
                isOpen={isKickModalOpen}
                setIsOpen={setIsKickModalOpen}
            />

            <MemberBanModal
                data={data}
                isOpen={isBanModalOpen}
                setIsOpen={setIsBanModalOpen}
            />
        </>
    );
}
