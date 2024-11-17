"use client";

import {
    Notice,
    NoticeButton,
    NoticeContent,
    NoticeIcon,
    NoticeTitle,
} from "@/components/ui/notice-general";
import { convertValueToLabel } from "@/lib/utils";
import { BrandRequest } from "@/lib/validations";
import Player from "next-video/player";
import Link from "next/link";
import { useState } from "react";
import { RequestWithdrawModal } from "../globals/modals";
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
    brandRequest: BrandRequest;
}

export function ExistBrandRequestPage({ brandRequest }: PageProps) {
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

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
                            <CardTitle>{brandRequest.name}</CardTitle>
                            <CardDescription>
                                Brand Request for {brandRequest.name} (
                                {brandRequest.email})
                            </CardDescription>
                        </CardHeader>

                        <div className="p-6">
                            <Badge
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

                    <CardContent className="space-y-4">
                        <p
                            className="text-sm text-muted-foreground"
                            dangerouslySetInnerHTML={{
                                __html: brandRequest.message.replace(
                                    /(?:\r\n|\r|\n)/g,
                                    "<br />"
                                ),
                            }}
                        />
                        {brandRequest.demoUrl && (
                            <>
                                <Separator />
                                <Player src={brandRequest.demoUrl} />
                            </>
                        )}
                    </CardContent>

                    <CardFooter className="justify-between gap-4 text-sm text-muted-foreground">
                        <Link
                            href={`mailto:${brandRequest.email}`}
                            className="hover:underline"
                        >
                            {brandRequest.email}
                        </Link>

                        <Link
                            href={brandRequest.website}
                            className="hover:underline"
                            target="_blank"
                        >
                            {brandRequest.website}
                        </Link>
                    </CardFooter>
                </Card>
            </div>

            <RequestWithdrawModal
                brandRequest={brandRequest}
                isOpen={isWithdrawModalOpen}
                setIsOpen={setIsWithdrawModalOpen}
            />
        </>
    );
}
