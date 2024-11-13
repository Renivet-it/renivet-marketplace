import { RolesPage } from "@/components/dashboard/roles";
import { DashShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { roleCache } from "@/lib/redis/methods";
import { roleSchema } from "@/lib/validations";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

export const metadata: Metadata = {
    title: "Roles",
    description: "Manage the platform's roles and permissions",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <div className="text-2xl font-semibold">Roles</div>
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
    let cachedRoles = await roleCache.getAll();
    if (!cachedRoles.length) {
        const roles = await db.query.roles.findMany({
            with: {
                userRoles: true,
            },
        });

        cachedRoles = roleSchema
            .extend({
                users: z.number(),
            })
            .array()
            .parse(
                roles.map((role) => ({
                    ...role,
                    users: role.userRoles.length,
                }))
            );

        await roleCache.addBulk(cachedRoles.map((x) => x!));
    }

    const initialRoles = cachedRoles.sort((a, b) => a.position - b.position);
    return <RolesPage initialRoles={initialRoles} />;
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
