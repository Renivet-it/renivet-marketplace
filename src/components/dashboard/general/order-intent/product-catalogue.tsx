"use client";

import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { convertPaiseToRupees } from "@/lib/utils";

export default function DownloadProducts() {
  // Fetch all products
  const { data: products = [], isLoading } =
    trpc.brands.products.getProducts.useQuery({
      page: 1,
      limit: 50,
      search: "",
    });

  const handleDownloadAll = () => {
    console.log(products, "products");

    const exportData = products.data.map((p: any) => ({
      "Product ID": p.id,
      "Product Name": p.title,
      Brand: p.brand?.name || "-",
      "Price (₹)": convertPaiseToRupees(p.price ?? 0),
      Availability: (p.quantity ?? 0) > 0 ? "In Stock" : "Out of Stock",
      "Added On": format(new Date(p.createdAt), "MMM dd, yyyy"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `products_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Export All Products
        </h2>
        <p className="text-gray-500 mb-6">
          Click the button below to download all products as an Excel file.
        </p>

        <button
          onClick={handleDownloadAll}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "Download Products"}
        </button>
      </div>

      {products.length > 0 && (
        <p className="text-gray-500 text-sm mt-4">
          Total Products: <span className="font-medium">{products.length}</span>
        </p>
      )}
    </div>
  );
}
