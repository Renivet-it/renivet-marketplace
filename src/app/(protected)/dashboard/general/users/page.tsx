import { UsersTable } from "@/components/dashboard/users";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { userWithAddressesAndRolesSchema } from "@/lib/validations";
import { desc } from "drizzle-orm";
import { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";

export const metadata: Metadata = {
    title: "Users",
    description: "Manage the platform's users",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <div className="text-2xl font-semibold">Users</div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the platform&apos;s users
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <UsersFetch searchParams={searchParams} />
            </Suspense>
        </DashShell>
    );
}

async function UsersFetch({ searchParams }: PageProps) {
    const { page: pageRaw, limit: limitRaw } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;

    const data = await db.query.users.findMany({
        with: {
            addresses: true,
            roles: {
                with: {
                    role: true,
                },
            },
        },
        limit,
        offset: (page - 1) * limit,
        orderBy: [desc(users.createdAt)],
        extras: {
            userCount: db.$count(users).as("user_count"),
        },
    });

    const parsed = userWithAddressesAndRolesSchema
        .extend({
            userCount: z
                .string({
                    required_error: "User count is required",
                    invalid_type_error: "User count must be a string",
                })
                .transform((x) => parseInt(x) || 0),
        })
        .array()
        .parse(
            data.map((user) => ({
                ...user,
                roles: user.roles.map((role) => role.role),
            }))
        );

    return <UsersTable initialUsers={parsed} />;
}
