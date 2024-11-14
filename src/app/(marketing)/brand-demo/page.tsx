import { BrandDemoPage } from "@/components/brand-demo";
import { GeneralShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { brandsWaitlist } from "@/lib/db/schema";
import { jwt } from "@/lib/jose";
import { cn } from "@/lib/utils";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";

interface PageProps {
    searchParams: Promise<{
        token: string;
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <Suspense fallback={<BrandDemoSkeleton />}>
            <BrandDemoFetch searchParams={searchParams} />
        </Suspense>
    );
}

async function BrandDemoFetch({ searchParams }: PageProps) {
    const { token } = await searchParams;
    if (!token) return <InvalidBrand />;

    const { data, error } = await jwt.verify(token);
    if (error) return <InvalidBrand />;

    const brandInfo = await db.query.brandsWaitlist.findFirst({
        where: eq(brandsWaitlist.brandEmail, data.subject),
    });
    if (!brandInfo) return <InvalidBrand />;

    return <BrandDemoPage brand={brandInfo} token={token} />;
}

function InvalidBrand() {
    return (
        <GeneralShell
            classNames={{
                mainWrapper: "flex-1 items-center",
                innerWrapper: "flex items-center justify-center",
            }}
        >
            <EmptyPlaceholder>
                <EmptyPlaceholderIcon>
                    <Icons.AlertTriangle className="size-10" />
                </EmptyPlaceholderIcon>

                <EmptyPlaceholderContent>
                    <EmptyPlaceholderTitle>Invalid Link</EmptyPlaceholderTitle>
                    <EmptyPlaceholderDescription>
                        The brand link is invalid. Please contact the
                        administrator.
                    </EmptyPlaceholderDescription>
                </EmptyPlaceholderContent>

                <Button asChild>
                    <Link href="/">Go Back</Link>
                </Button>
            </EmptyPlaceholder>
        </GeneralShell>
    );
}

function BrandDemoSkeleton() {
    return (
        <GeneralShell
            classNames={{
                innerWrapper:
                    "w-full max-w-5xl space-y-4 p-8 py-10 xl:max-w-5xl",
            }}
        >
            <Skeleton className="h-12 w-1/5" />

            <div className="space-y-1">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className={cn("h-5 w-full", i === 1 && "w-2/5")}
                    />
                ))}
            </div>

            <Skeleton className="h-5 w-1/2" />

            <Separator />

            <div className="space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-80 w-full" />
            </div>

            <Skeleton className="h-10 w-full" />
        </GeneralShell>
    );
}
