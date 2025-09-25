// src/components/analytics/facebook-pixel-events.tsx
"use client";

import { useEffect } from "react";
import { fbEvent } from "@/lib/fbpixel";
import { ProductWithBrand } from "@/lib/validations";
import { convertPaiseToRupees } from "@/lib/utils";

interface ViewContentProps {
  product: ProductWithBrand;
}

export function TrackViewContent({ product }: ViewContentProps) {
  useEffect(() => {
    // Add a small delay to ensure pixel is loaded
    const timer = setTimeout(() => {
      if (product && typeof window !== "undefined" && window.fbq) {
        fbEvent("ViewContent", {
          content_ids: [product.id], // Make sure this matches your product catalog
          content_name: product.title,
          content_type: "product",
          value: parseFloat(convertPaiseToRupees(product.costPerItem
  ? (product.costPerItem / 100)
  : product.variants?.[0]?.price
    ? (product.variants[0].price / 100)
    : 0.00)),
          currency: "INR",
          content_category: product.brand?.name || "Unknown Brand",
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [product]);

  return null;
}