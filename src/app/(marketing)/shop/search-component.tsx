"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Product = {
  id?: string;
  productTypeId?: string;
  productType?: { id: string; name: string };
  [k: string]: any;
};

export function SearchableProductTypes({
  productTypes,
  initialProducts = [],
  products: productsProp,
  productTypeId,
  isDesktop = false,
}: {
  productTypes: { id: string; name: string }[];
  initialProducts?: Product[];    // server-passed initial data
  products?: Product[];           // alternate prop name (optional)
  productTypeId?: string;
  isDesktop?: boolean;
}) {
  const searchParams = useSearchParams();
  const qpString = searchParams.toString(); // stable string to watch
  const searchTerm = searchParams.get("search") ?? "";

  // 1) start with whichever prop the parent passed (fallback to [])
  const [products, setProducts] = useState<Product[]>(
    productsProp ?? initialProducts ?? []
  );
  const [loading, setLoading] = useState(false);

  // 2) sync when parent updates the prop (e.g. full page navigation / SSR)
  useEffect(() => {
    setProducts(productsProp ?? initialProducts ?? []);
  }, [productsProp, initialProducts]);

  // 3) fetch fresh product list from the API every time query string changes
  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      console.log("[SearchableProductTypes] fetching /api/products?"+qpString);
      try {
        const res = await fetch(`/api/products?${qpString}`, { cache: "no-store" });
        const json = await res.json();
        console.log("[SearchableProductTypes] api response:", json);

        // Normalize to an array using common shapes
        let items: Product[] = [];
        if (Array.isArray(json)) items = json;
        else if (Array.isArray(json.data)) items = json.data;
        else if (Array.isArray(json.products)) items = json.products;
        else if (Array.isArray(json.result)) items = json.result;
        else items = [];

        if (mounted) setProducts(items);
      } catch (err) {
        console.error("[SearchableProductTypes] fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Kick off fetch (do it even if qpString is empty so initialProducts can be refreshed)
    fetchProducts();

    return () => {
      mounted = false;
    };
  }, [qpString]); // run when any query param changes

  // 4) compute active types from the (client) products state
  const activeTypes = useMemo(() => {
    const unique = new Set<string>();
    const types: { id: string; name: string }[] = [];

    for (const p of products) {
      const pt = p.productType;
      if (pt && !unique.has(pt.id)) {
        unique.add(pt.id);
        types.push(pt);
      }
    }

    // if no types found and there's no search, fall back to the global types passed from server
    if (types.length === 0 && !searchTerm) return productTypes;
    return types;
  }, [products, productTypes, searchTerm]);

  return (
    <div className={cn("space-y-3", isDesktop && "flex flex-col gap-3 flex-1")}>
      <div
        className={cn(
          "flex gap-2 flex-wrap",
          !isDesktop && "overflow-x-auto pb-2 scrollbar-hide"
        )}
      >
        <a
          href="?productTypeId="
          className={cn(
            "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            !productTypeId && "bg-black text-white border-black"
          )}
        >
          All Items
        </a>

        {loading ? (
          <p className="text-sm text-muted-foreground px-2">Loading...</p>
        ) : activeTypes.length > 0 ? (
          activeTypes.map((type) => (
            <a
              key={type.id}
              href={`?productTypeId=${type.id}`}
              className={cn(
                "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                productTypeId === type.id && "bg-black text-white border-black"
              )}
            >
              {type.name}
            </a>
          ))
        ) : (
          <p className="text-sm text-muted-foreground px-2">No related types</p>
        )}
      </div>
    </div>
  );
}
