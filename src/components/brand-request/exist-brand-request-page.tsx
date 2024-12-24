"use client";

import {
    Notice,
    NoticeButton,
    NoticeContent,
    NoticeIcon,
    NoticeTitle,
} from "@/components/ui/notice-general";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel, handleClientError } from "@/lib/utils";
import {
    BrandRequest,
    BrandRequestWithoutConfidentials,
} from "@/lib/validations";
import Player from "next-video/player";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { RequestWithdrawModal, ViewConfidentialModal } from "../globals/modals";
import { Icons } from "../icons";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button-general";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";

interface PageProps extends GenericProps {
    brandRequest: BrandRequestWithoutConfidentials;
}

export function ExistBrandRequestPage({ brandRequest }: PageProps) {
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isConfidentialDataModalOpen, setIsConfidentialDataModalOpen] =
        useState(false);
    const [confidentialData, setConfidentialData] =
        useState<BrandRequest | null>(null);

    const { mutate: getConfidentialData, isPending: isDataFetching } =
        trpc.general.brands.requests.getRequestByOwnerId.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Fetching confidential data...");
                return { toastId };
            },
            onSuccess: (data, __, { toastId }) => {
                toast.success("Confidential data fetched successfully", {
                    id: toastId,
                });
                setConfidentialData(data as BrandRequest);
                setIsConfidentialDataModalOpen(true);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <>
            <div className="space-y-4">
                {brandRequest.status === "pending" && (
                    <>
                        <Notice>
                            <NoticeContent>
                                <NoticeTitle>
                                    <NoticeIcon />
                                    <span>Warning</span>
                                </NoticeTitle>

                                <p className="text-sm">
                                    You have already submitted a brand request
                                    for the brand{" "}
                                    <strong>{brandRequest.name}</strong>. You
                                    can withdraw the request if you want to.
                                </p>
                            </NoticeContent>

                            <NoticeButton asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsWithdrawModalOpen(true)}
                                >
                                    Withdraw Request
                                </Button>
                            </NoticeButton>
                        </Notice>

                        <Separator />
                    </>
                )}

                <Card className="rounded-none">
                    <div className="flex items-center justify-between gap-5">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Avatar className="size-6 rounded-none">
                                    <AvatarImage
                                        src={brandRequest.logoUrl}
                                        alt={brandRequest.name}
                                    />
                                    <AvatarFallback>
                                        {brandRequest.name[0]}
                                    </AvatarFallback>
                                </Avatar>

                                <CardTitle>{brandRequest.name}</CardTitle>
                            </div>

                            <CardDescription>
                                Brand Request for {brandRequest.name} (
                                {brandRequest.email})
                            </CardDescription>
                        </CardHeader>

                        <div className="p-6">
                            <Badge
                                className="rounded-none"
                                variant={
                                    brandRequest.status === "pending"
                                        ? "default"
                                        : brandRequest.status === "approved"
                                          ? "secondary"
                                          : "destructive"
                                }
                            >
                                {convertValueToLabel(brandRequest.status)}
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    <CardContent className="space-y-4 pt-6">
                        <p
                            className="text-sm text-muted-foreground"
                            dangerouslySetInnerHTML={{
                                __html:
                                    brandRequest.message?.replace(
                                        /(?:\r\n|\r|\n)/g,
                                        "<br />"
                                    ) || "N/A",
                            }}
                        />

                        {brandRequest.demoUrl && (
                            <div className="space-y-4">
                                <Separator />

                                <h5 className="font-medium">Demo Video:</h5>
                                <Player src={brandRequest.demoUrl} />
                            </div>
                        )}

                        <Separator />

                        <Notice>
                            <NoticeContent>
                                <NoticeTitle className="gap-2">
                                    <Icons.Briefcase className="size-4" />
                                    <span>Business Details (Confidential)</span>
                                </NoticeTitle>

                                <p className="text-sm">
                                    Click the button to view the confidential
                                    business details.
                                </p>
                            </NoticeContent>

                            <NoticeButton asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isDataFetching}
                                    onClick={() => {
                                        if (confidentialData)
                                            setIsConfidentialDataModalOpen(
                                                true
                                            );
                                        else
                                            getConfidentialData({
                                                ownerId: brandRequest.ownerId,
                                                sendConfidentialData: true,
                                            });
                                    }}
                                >
                                    View Details
                                </Button>
                            </NoticeButton>
                        </Notice>

                        <Separator />
                    </CardContent>

                    <Separator />

                    <CardFooter className="justify-between gap-4 pt-6 text-sm text-muted-foreground">
                        <Link
                            href={`mailto:${brandRequest.email}`}
                            className="hover:underline"
                        >
                            {brandRequest.email}
                        </Link>

                        {brandRequest.website ? (
                            <Link
                                href={brandRequest.website}
                                className="hover:underline"
                                target="_blank"
                            >
                                {brandRequest.website}
                            </Link>
                        ) : (
                            <p>N/A</p>
                        )}
                    </CardFooter>
                </Card>
            </div>

            <RequestWithdrawModal
                brandRequest={brandRequest}
                isOpen={isWithdrawModalOpen}
                setIsOpen={setIsWithdrawModalOpen}
            />

            {confidentialData && (
                <ViewConfidentialModal
                    brandRequest={confidentialData}
                    isOpen={isConfidentialDataModalOpen}
                    setIsOpen={setIsConfidentialDataModalOpen}
                />
            )}
        </>
    );
}
