import { OrdersTable } from "@/components/dashboard/brands/orders";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { orderQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import { Suspense } from "react";
import { orderSchema } from "@/lib/validations"; // Fixed import path based on context
import { z } from "zod";

// ---------------------------------------------------------
// CONFIGURATION: Change these two lines for each folder/page
// ---------------------------------------------------------
const PAGE_STATUS = "new"; // Match this to your DB Enum (e.g., 'new', 'shipped', 'delivered')
const PAGE_TITLE = "New Orders";
const PAGE_DESC = "View all new orders placed by customers";
// ---------------------------------------------------------

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
};

interface PageProps {
  params: Promise<{
    bId: string;
  }>;
}

export default function Page(props: PageProps) {
  return (
    <DashShell>
      <div className="space-y-1 text-center md:text-start">
        <h1 className="text-2xl font-bold">{PAGE_TITLE}</h1>
        <p className="text-balance text-sm text-muted-foreground">
          {PAGE_DESC}
        </p>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <OrdersFetch {...props} />
      </Suspense>
    </DashShell>
  );
}

async function OrdersFetch({ params }: PageProps) {
  const { bId } = await params;
  const shipmentStatus = "cancelled"; // ← CUSTOMIZE PAGE

  // PASS THE STATUS VARIABLE HERE
  // Ensure your query accepts this second argument
  const { data, total } = await orderQueries.getOrdersByBrandId(
    bId,
    1,
    10,
   shipmentStatus,

  );
  const parsedData = z.array(orderSchema).parse(data);

  return (
    <OrdersTable
      initialData={parsedData}
      brandId={bId}
      totalCount={total}
      shipmentStatus={shipmentStatus} // ⭐ REQUIRED
    />
  );
}