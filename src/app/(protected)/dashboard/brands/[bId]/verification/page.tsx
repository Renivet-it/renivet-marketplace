import { BrandConfidentialForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import {
    Notice,
    NoticeContent,
    NoticeIcon,
    NoticeTitle,
} from "@/components/ui/notice-dash";
import { brandQueries } from "@/lib/db/queries";
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

            <Suspense fallback={<TableSkeleton />}>
                <VerificationFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function VerificationFetch({ params }: PageProps) {
    const { bId } = await params;

    const existingBrand = await brandQueries.getBrand(bId);
    if (!existingBrand) notFound();

    if (existingBrand.isConfidentialSentForVerification)
        return (
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
        );
    if (existingBrand.confidentialVerificationStatus === "approved")
        return (
            <Notice>
                <NoticeContent>
                    <NoticeTitle>
                        <Icons.CircleCheck className="size-4" />
                        <span>Congrats</span>
                    </NoticeTitle>

                    <p className="text-sm">
                        Your brand has been verified successfully. You can now
                        start selling your products on our platform.
                    </p>
                </NoticeContent>
            </Notice>
        );
    if (existingBrand.confidentialVerificationStatus === "rejected")
        return (
            <Notice>
                <NoticeContent>
                    <NoticeTitle>
                        <NoticeIcon />
                        <span>Warning</span>
                    </NoticeTitle>

                    <p className="text-sm">
                        The brand verification request has been rejected. Please
                        delete the brand and create a new request.
                    </p>
                </NoticeContent>
            </Notice>
        );

    return <BrandConfidentialForm brandId={existingBrand.id} />;
}
