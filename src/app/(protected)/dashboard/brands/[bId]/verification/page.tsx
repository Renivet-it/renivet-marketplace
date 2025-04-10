import { BrandConfidentialForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import {
    Notice,
    NoticeContent,
    NoticeIcon,
    NoticeTitle,
} from "@/components/ui/notice-dash";
import { brandConfidentialQueries } from "@/lib/db/queries";
import { brandCache, mediaCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string }>;
}

export const metadata: Metadata = {
    title: "Brand Verification",
    description: "Verify the brand before publishing products",
};

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Brand Verification</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Verify the brand before publishing products
                    </p>
                </div>
            </div>

            <Suspense>
                <VerificationFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function VerificationFetch({ params }: PageProps) {
    const { bId } = await params;

    const [existingBrand, existingBrandConfidential, media] = await Promise.all(
        [
            brandCache.get(bId),
            brandConfidentialQueries.getBrandConfidential(bId),
            mediaCache.getAll(bId),
        ]
    );
    if (!existingBrand) notFound();

    return (
        <>
            {existingBrand.confidentialVerificationStatus === "pending" && (
                <Notice>
                    <NoticeContent>
                        <NoticeTitle>
                            <Icons.Clock className="size-4" />
                            <span>Pending</span>
                        </NoticeTitle>

                        <p className="text-sm">
                            The brand is under verification process. You will be
                            notified once the verification is complete.
                        </p>
                    </NoticeContent>
                </Notice>
            )}

            {existingBrand.confidentialVerificationStatus === "approved" && (
                <Notice>
                    <NoticeContent>
                        <NoticeTitle>
                            <Icons.CircleCheck className="size-4" />
                            <span>Congrats</span>
                        </NoticeTitle>

                        <p className="text-sm">
                            Your brand has been verified successfully. You can
                            now start selling your products on our platform.
                        </p>
                    </NoticeContent>
                </Notice>
            )}

            {existingBrand.confidentialVerificationStatus === "rejected" && (
                <Notice>
                    <NoticeContent>
                        <NoticeTitle>
                            <NoticeIcon />
                            <span>Warning</span>
                        </NoticeTitle>

                        <p className="text-sm">
                            The brand verification request has been rejected.
                            Read the reason below and update the details to
                            proceed.
                        </p>

                        <p className="text-sm">
                            <span className="font-semibold">Reason: </span>
                            {existingBrand.confidentialVerificationRejectedReason ??
                                "No reason provided"}
                        </p>
                    </NoticeContent>
                </Notice>
            )}

            <BrandConfidentialForm
                brand={existingBrand}
                brandConfidential={existingBrandConfidential ?? undefined}
                allMedia={media.data}
            />
        </>
    );
}
