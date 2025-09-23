"use client";

import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useState } from "react";

export default function DownloadProducts() {
  const [isDownloading, setIsDownloading] = useState(false);
  const utils = trpc.useUtils(); // gives us a client instance to call queries on demand

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      // 👇 Fetch products only when download is requested
      const products = await utils.brands.products.getProducts.fetch({
        isActive: true,
        isPublished: true,
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 100000000000000, // keep a reasonable cap
        page: 1,
      });

      if (!products?.data?.length) {
        setIsDownloading(false);
        return;
      }

      const exportData = products.data.map((p: any) => {
        let pricePaise: number | undefined = p.costPerItem;

        if (!pricePaise && Array.isArray(p.variants) && p.variants.length > 0) {
          const variantWithPrice = p.variants.find((v: any) => v.costPerItem);
          pricePaise = variantWithPrice?.costPerItem;
        }

        const price = pricePaise
          ? `${(pricePaise / 100).toFixed(2)} INR`
          : "0.00 INR";

        return {
          id: p.id,
          title: p.title,
          description: p.description || "-",
          availability: (p.quantity ?? 0) > 0 ? "in stock" : "out of stock",
          condition: p.condition || "new",
          price,
          link: `https://renivet.com/products/${p.slug}`,
          image_link:
            p.media[0]?.mediaItem?.url ||
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1",
          brand: p.brand?.name || "-",
        };
      });

      // 🟢 Create and save Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(blob, `products_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Export All Products
        </h2>
        <p className="text-gray-500 mb-6">
          Click below to download all products as an Excel file.
        </p>

        <button
          onClick={handleDownloadAll}
          disabled={isDownloading}
          className="relative w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isDownloading && (
            <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {isDownloading ? "Preparing Download..." : "Download Products"}
        </button>
      </div>
    </div>
  );
}
