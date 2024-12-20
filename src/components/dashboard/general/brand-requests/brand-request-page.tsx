"use client";

import {
    RequestApproveModal,
    RequestRejectModal,
} from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { convertValueToLabel, handleClientError, slugify } from "@/lib/utils";
import {
    brandRequestConfidentialsSchema,
    BrandRequestWithOwner,
} from "@/lib/validations";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import Player from "next-video/player";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface PageProps {
    request: BrandRequestWithOwner;
}

export function BrandRequestPage({ request }: PageProps) {
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const { mutate: downloadLogo, isPending: isLogoDownloading } = useMutation({
        onMutate: () => {
            const toastId = toast.loading(
                "Downloading logo, please do not close the window..."
            );
            return { toastId };
        },
        mutationFn: async () => {
            const response = await fetch(request.logoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;

            const fileName = slugify(
                `${request.name} ${request.owner.firstName} ${request.owner.lastName} logo`
            );
            if (!fileName) throw new Error("Invalid file name");

            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Logo downloaded successfully", { id: toastId });
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: downloadDemoVideo, isPending: isDemoVideoDownloading } =
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

                const fileName = slugify(
                    `${request.name} ${request.owner.firstName} ${request.owner.lastName} demo video`
                );
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
            <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">
                        Request from {request.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View and Manage the brand request from {request.name}
                    </p>
                </div>

                <Badge
                    variant={
                        request.status === "pending"
                            ? "default"
                            : request.status === "approved"
                              ? "secondary"
                              : "destructive"
                    }
                >
                    {convertValueToLabel(request.status)}
                </Badge>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Owner Information</CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div>
                                <h5 className="text-sm font-medium">ID</h5>
                                <button
                                    className="break-words text-sm text-primary underline"
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            request.owner.id
                                        );
                                        return toast.success(
                                            "ID copied to clipboard"
                                        );
                                    }}
                                >
                                    {request.owner.id}
                                </button>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Name</h5>
                                <p className="text-sm">
                                    {request.owner.firstName}{" "}
                                    {request.owner.lastName}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Email</h5>
                                <Link
                                    href={`mailto:${request.owner.email}`}
                                    className="break-words text-sm text-primary underline"
                                >
                                    {request.owner.email}
                                </Link>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Phone</h5>
                                <p className="text-sm">
                                    {request.owner.phone ?? "N/A"}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Registered On
                                </h5>
                                <p className="text-sm">
                                    {format(
                                        new Date(request.owner.createdAt),
                                        "MMM dd, yyyy"
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Brand Information</CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div>
                                <h5 className="text-sm font-medium">Name</h5>
                                <p className="text-sm">{request.name}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Email</h5>
                                <Link
                                    href={`mailto:${request.email}`}
                                    className="break-words text-sm text-primary underline"
                                >
                                    {request.email}
                                </Link>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Phone</h5>
                                <p className="text-sm">{request.phone}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Website</h5>
                                <Link
                                    href={request.website}
                                    className="break-words text-sm text-primary underline"
                                    target="_blank"
                                >
                                    {request.website}
                                </Link>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Logo</h5>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="text-sm text-primary underline">
                                            Click here
                                        </button>
                                    </PopoverTrigger>

                                    <PopoverContent className="overflow-hidden p-0">
                                        <div className="relative aspect-square size-full overflow-hidden">
                                            <Image
                                                src={request.logoUrl}
                                                alt={request.name}
                                                width={500}
                                                height={500}
                                                className="size-full object-cover"
                                            />

                                            <button
                                                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-sm bg-foreground text-background shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                                disabled={isLogoDownloading}
                                                onClick={() => downloadLogo()}
                                            >
                                                <span className="sr-only">
                                                    Download Logo
                                                </span>
                                                <Icons.Download className="size-4" />
                                            </button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Requested On
                                </h5>
                                <p className="text-sm">
                                    {format(
                                        new Date(request.createdAt),
                                        "MMM dd, yyyy"
                                    )}
                                </p>
                            </div>

                            <div className="space-y-1 md:col-span-3">
                                <h5 className="text-sm font-medium">Message</h5>

                                <p
                                    className="rounded-sm bg-muted p-2 text-sm"
                                    dangerouslySetInnerHTML={{
                                        __html: request.message.replace(
                                            /(?:\r\n|\r|\n)/g,
                                            "<br />"
                                        ),
                                    }}
                                />
                            </div>

                            <div className="space-y-1 md:col-span-3">
                                <h5 className="text-sm font-medium">
                                    Demo Video
                                </h5>

                                {request.demoUrl ? (
                                    <div className="relative">
                                        <Player src={request.demoUrl} />

                                        <button
                                            className="absolute right-2 top-2 flex items-center justify-center gap-1 rounded-md bg-background/10 p-2 text-background shadow-md backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={isDemoVideoDownloading}
                                            onClick={() => downloadDemoVideo()}
                                        >
                                            <span className="sr-only">
                                                Download Demo Video
                                            </span>
                                            <Icons.Download className="size-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm">N/A</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Business Information</CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            {Object.keys(
                                brandRequestConfidentialsSchema.shape
                            ).map((key) => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const value = (request as any)[key];
                                const finalValue = !value ? (
                                    "N/A"
                                ) : typeof value === "string" &&
                                  (value.startsWith("http://") ||
                                      value.startsWith("https://")) ? (
                                    <Link
                                        href={value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary underline"
                                    >
                                        Click here
                                    </Link>
                                ) : (
                                    value
                                );

                                return (
                                    <div key={key}>
                                        <h5 className="text-sm font-medium">
                                            {convertValueToLabel(key)}
                                        </h5>
                                        <p className="text-sm">{finalValue}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {request.status === "pending" && (
                    <div className="flex flex-col items-center gap-2 md:flex-row">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => setIsRejectModalOpen(true)}
                        >
                            Reject
                        </Button>

                        <Button
                            className="w-full"
                            onClick={() => setIsApproveModalOpen(true)}
                        >
                            Approve
                        </Button>
                    </div>
                )}
            </div>

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
