import { RolesPage } from "@/components/dashboard/brands/roles";
import { DashShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Skeleton } from "@/components/ui/skeleton";
import { brandCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string }>;
}

export const metadata: Metadata = {
    title: "Roles",
    description: "Manage the brand's roles and permissions",
};

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Roles</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the brand&apos;s roles and permissions
                    </p>
                </div>

                <Suspense
                    fallback={
                        <Button
                            disabled
                            className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                        >
                            <Icons.PlusCircle className="size-5" />
                            Create New Role
                        </Button>
                    }
                >
                    <NewRoleButton params={params} />
                </Suspense>
            </div>

            <Suspense fallback={<RolesPageSkeleton />}>
                <RolesFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function RolesFetch({ params }: PageProps) {
    const { bId } = await params;
    const cachedBrand = await brandCache.get(bId);
    if (!cachedBrand) notFound();

    return <RolesPage brandId={bId} initialData={cachedBrand} />;
}

async function NewRoleButton({ params }: PageProps) {
    const { bId } = await params;

    return (
        <Button asChild className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm">
            <Link href={`/dashboard/brands/${bId}/roles/new`}>
                <Icons.PlusCircle className="size-5" />
                Create New Role
            </Link>
        </Button>
    );
}

function RolesPageSkeleton() {
    return (
        <ul className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.5rem] w-full rounded-md" />
            ))}
        </ul>
    );
}
