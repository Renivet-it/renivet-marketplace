import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { orderQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { Suspense } from "react";
import { ShipmentDiscrepancyTable } from "@/components/dashboard/general/discrepency-table/discrepency-table";

export const metadata: Metadata = {
  title: "Shipment Discrepancies",
  description: "View shipment discrepancies flagged during order creation",
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
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Shipment Discrepancies</h1>
          <p className="text-sm text-muted-foreground">
            Automatically detected shipment issues
          </p>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <DiscrepancyFetch {...props} />
      </Suspense>
    </DashShell>
  );
}

/* ================= SERVER FETCH ================= */

async function DiscrepancyFetch({ searchParams }: PageProps) {
  const {
    page: pageRaw,
    limit: limitRaw,
    search: searchRaw,
  } = await searchParams;

  const page =
    pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;

  const limit =
    limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;

  const search = searchRaw?.length ? searchRaw : undefined;

  const data = await orderQueries.getAllShipmentDiscrepancies({
    page,
    limit,
    search,
  });
console.log(page, "page");
  return <ShipmentDiscrepancyTable initialData={data} />;
}
