import { UsersTable } from "@/components/dashboard/users";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { userQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Users",
    description: "Manage the platform's users",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
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
    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await userQueries.getUsers({
        limit,
        page,
        search,
    });

    return <UsersTable initialData={data} />;
}
