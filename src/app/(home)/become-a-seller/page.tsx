import { ExistBrandRequestPage } from "@/components/brand-request";
import { BrandRequestForm } from "@/components/globals/forms";
import { GeneralShell } from "@/components/globals/layouts";
import { Button } from "@/components/ui/button-general";
import {
    Notice,
    NoticeButton,
    NoticeContent,
    NoticeIcon,
    NoticeTitle,
} from "@/components/ui/notice-general";
import { db } from "@/lib/db";
import { brandRequestQueries } from "@/lib/db/queries";
import { brandMembers } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Become a Seller",
    description: "Register your brand with us.",
};

export default function Page() {
    return (
        <GeneralShell
            classNames={{
                innerWrapper: "xl:max-w-5xl",
            }}
        >
            <div className="space-y-1">
                <h1 className="text-2xl font-bold md:text-3xl">
                    Become a Seller
                </h1>
                <p className="text-sm text-muted-foreground">
                    Register your brand with us to start selling your products
                    on our platform.
                </p>
            </div>

            <BecomeASellerFetch />
        </GeneralShell>
    );
}

async function BecomeASellerFetch() {
    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    const [
        existingBrandRequest,
        existingBrandMember,
        existingRejectedRequest,
        existingUser,
    ] = await Promise.all([
        brandRequestQueries.getBrandRequestByOwnerId(userId, "rejected", "ne"),
        db.query.brandMembers.findFirst({
            where: eq(brandMembers.memberId, userId),
            with: {
                brand: true,
            },
        }),
        brandRequestQueries.getRecentRejectedRequest(userId),
        userCache.get(userId),
    ]);

    if (!existingUser) redirect("/auth/signin");

    if (existingUser?.roles.some((role) => role.isSiteRole)) {
        return (
            <Notice>
                <NoticeContent>
                    <NoticeTitle>
                        <NoticeIcon />
                        <span>Notification</span>
                    </NoticeTitle>

                    <p className="text-sm">
                        Only normal users can submit a brand request. You have
                        access to the admin panel.
                    </p>
                </NoticeContent>
            </Notice>
        );
    }

    if (existingBrandRequest)
        return <ExistBrandRequestPage brandRequest={existingBrandRequest} />;

    if (existingBrandMember && !existingBrandMember.isOwner)
        return (
            <Notice>
                <NoticeContent>
                    <NoticeTitle>
                        <NoticeIcon />
                        <span>Notification</span>
                    </NoticeTitle>

                    <p className="text-sm">
                        You are already a member of a brand (
                        <strong>{existingBrandMember.brand.name}</strong>).
                        Leave the brand to submit a new brand request.
                    </p>
                </NoticeContent>

                <NoticeButton asChild>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="#">Leave Brand</Link>
                    </Button>
                </NoticeButton>
            </Notice>
        );

    if (existingRejectedRequest)
        return (
            <Notice>
                <NoticeContent>
                    <NoticeTitle>
                        <NoticeIcon />
                        <span>Notification</span>
                    </NoticeTitle>

                    <p className="text-sm">
                        Your previous brand request was rejected. You can submit
                        a new request after{" "}
                        <strong>
                            {format(
                                new Date(
                                    existingRejectedRequest.rejectedAt!
                                ).getTime() +
                                    1000 * 60 * 60 * 24 * 3,
                                "MMMM d, yyyy"
                            )}
                        </strong>
                        .
                    </p>

                    <p className="text-sm">
                        <span className="font-semibold">Reason: </span>{" "}
                        {existingRejectedRequest.rejectionReason ||
                            "No reason provided."}
                    </p>
                </NoticeContent>
            </Notice>
        );

    return <BrandRequestForm user={existingUser} />;
}
