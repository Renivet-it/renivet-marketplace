import DownloadProducts from "@/components/dashboard/general/order-intent/product-catalogue";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Products",
  description: "Export all products as Excel",
};

export default function Page() {
  return (
    <DashShell>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div className="space-y-1 text-center md:text-start">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Download Products
          </h1>
          <p className="text-gray-500 text-sm">
            Export all products from your catalog to an Excel file.
          </p>
        </div>
      </div>

      <DownloadProducts />
    </DashShell>
  );
}
