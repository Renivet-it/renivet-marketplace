"use client";

import {
    RequestApproveModal,
    RequestRejectModal,
} from "@/components/globals/modals";
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
import {
    cn,
    convertValueToLabel,
    handleClientError,
    hideEmail,
} from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import Player from "next-video/player";
import { useState } from "react";
import { toast } from "sonner";
import { TableBrandRequests } from "./brand-requests-table";

interface PageProps {
    request: TableBrandRequests;
}

export function BrandRequestAction({ request }: PageProps) {
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const { mutate: downloadVideo, isPending: isVideoDownloading } =
        useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    "Downloading video, please do not close the window..."
                );
                return { toastId };
            },
            mutationFn: async () => {
                if (!request.demoUrl) throw new Error("No demo video found");

                const response = await fetch(request.demoUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = url;

                const fileName = request.demoUrl.split("/").pop();
                if (!fileName) throw new Error("Invalid file name");

                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Video downloaded successfully", { id: toastId });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" className="size-8 p-0">
                        <Icons.Settings2 className="size-4" />
                        <span className="sr-only">Actions</span>
                    </Button>
                </SheetTrigger>

                <SheetContent className="space-y-4 overflow-y-scroll p-4">
                    <SheetHeader>
                        <SheetTitle className="sr-only hidden">
                            Waitlist Actions
                        </SheetTitle>

                        <div className="flex items-center gap-2 text-start">
                            <Avatar>
                                <AvatarImage
                                    src={
                                        request.owner.avatarUrl ??
                                        DEFAULT_AVATAR_URL
                                    }
                                    alt={request.registrant}
                                />
                                <AvatarFallback>
                                    {request.registrant[0]}
                                </AvatarFallback>
                            </Avatar>

                            <div>
                                <p className="text-sm font-semibold">
                                    {request.registrant}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {hideEmail(request.registrantEmail)}
                                </p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="grid grid-cols-3 items-center divide-x">
                        {Object.entries({
                            email: request.email,
                            ownerEmail: request.registrantEmail,
                            website: request.website,
                        }).map(([key, value]) => {
                            const Icon = key.toLowerCase().includes("email")
                                ? Icons.Mail
                                : key.toLowerCase().includes("phone")
                                  ? Icons.Phone
                                  : key.toLowerCase().includes("website")
                                    ? Icons.Globe
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

                    {request.demoUrl && (
                        <div className="space-y-4 text-sm">
                            <div className="space-y-2">
                                <p>Demo Video</p>

                                <Player src={request.demoUrl} />

                                <Button
                                    size="sm"
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => downloadVideo()}
                                    disabled={isVideoDownloading}
                                >
                                    <Icons.Download className="size-5" />
                                    Save
                                </Button>
                            </div>
                        </div>
                    )}

                    <Separator />

                    <div className="space-y-4 text-sm">
                        <div className="space-y-2">
                            <p>Message</p>

                            <p
                                className="text-sm text-muted-foreground"
                                dangerouslySetInnerHTML={{
                                    __html: request.message.replace(
                                        /(?:\r\n|\r|\n)/g,
                                        "<br />"
                                    ),
                                }}
                            />
                        </div>
                    </div>
                    <Separator />

                    <div className="flex flex-col items-center gap-2 md:flex-row">
                        <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() => setIsRejectModalOpen(true)}
                        >
                            Reject
                        </Button>
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={() => setIsApproveModalOpen(true)}
                        >
                            Approve
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <RequestApproveModal
                request={request}
                isOpen={isApproveModalOpen}
                setIsOpen={setIsApproveModalOpen}
            />

            <RequestRejectModal
                request={request}
                isOpen={isRejectModalOpen}
                setIsOpen={setIsRejectModalOpen}
            />
        </>
    );
}
