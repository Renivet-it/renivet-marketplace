import { RolesPage } from "@/components/dashboard/general/roles";
import { DashShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Skeleton } from "@/components/ui/skeleton";
import { roleCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Roles",
    description: "Manage the platform's roles and permissions",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Roles</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s roles and permissions
                    </p>
                </div>

                <Button
                    asChild
                    className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                >
                    <Link href="/dashboard/general/roles/new">
                        <Icons.PlusCircle className="size-5" />
                        Create New Role
                    </Link>
                </Button>
            </div>

            <Suspense fallback={<RolesPageSkeleton />}>
                <RolesFetch />
            </Suspense>
        </DashShell>
    );
}

async function RolesFetch() {
    const cachedRoles = await roleCache.getAll();

    const data = cachedRoles
        .filter((role) => role.isSiteRole)
        .sort((a, b) => a.position - b.position);
    return <RolesPage initialData={data} />;
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
