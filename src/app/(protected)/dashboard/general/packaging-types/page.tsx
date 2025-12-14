import {
  PackingTypesPage,
  PackingTypesTable,
} from "@/components/dashboard/general/packaing-types";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { orderQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Packing Types",
  description: "Manage packing types for products",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
  }>;
}

export default function Page(props: PageProps) {
  return (
    <DashShell>
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
        <div className="space-y-1 text-center md:text-start">
          <h1 className="text-2xl font-bold">Packing Types</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Manage packing types for products
          </p>
        </div>

        <PackingTypesPage />
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <PackingTypesFetch {...props} />
      </Suspense>
    </DashShell>
  );
}

async function PackingTypesFetch({ searchParams }: PageProps) {
  const {
    page: pageRaw,
    limit: limitRaw,
    search: searchRaw,
  } = await searchParams;

  const limit =
    limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;

  const page =
    pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;

  const search = searchRaw?.length ? searchRaw : undefined;

  const data = await orderQueries.getAllPackingTypes({
    page,
    limit,
    search,
  });

  // same pattern as Orders
  // @ts-ignore
  return <PackingTypesTable initialData={data} />;
}
