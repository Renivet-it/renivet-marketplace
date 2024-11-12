import { BannerManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id } = await params;

    const existingBanner = await db.query.banners.findFirst({
        where: eq(banners.id, id),
    });
    if (!existingBanner)
        return {
            title: "Banner not found",
            description: "The requested banner was not found.",
        };

    return {
        title: `Edit "${existingBanner.title}"`,
        description: existingBanner.description,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <div className="text-2xl font-semibold">Edit Banner</div>
                <p className="text-sm text-muted-foreground">
                    Edit the banner and update it on the platform
                </p>
            </div>

            <Suspense fallback={<>Loading...</>}>
                <BannerEditFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function BannerEditFetch({ params }: PageProps) {
    const { id } = await params;

    const existingBanner = await db.query.banners.findFirst({
        where: eq(banners.id, id),
    });
    if (!existingBanner) notFound();

    return <BannerManageForm banner={existingBanner} />;
}
