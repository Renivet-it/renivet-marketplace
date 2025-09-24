// src/components/analytics/facebook-pixel-events.tsx
"use client";

import { useEffect } from "react";
import { fbEvent } from "@/lib/fbpixel"; // Assuming you have this helper
import { ProductWithBrand } from "@/lib/validations";
import { convertPaiseToRupees } from "@/lib/utils";

interface ViewContentProps {
  product: ProductWithBrand;
}

export function TrackViewContent({ product }: ViewContentProps) {
  useEffect(() => {
    if (product) {
      fbEvent("ViewContent", {
        content_ids: [product.id], // Use the database product ID
        content_name: product.title,
        content_type: "product",
        value: parseFloat(convertPaiseToRupees(product.price ?? 0)),
        currency: "INR",
      });
    }
  }, [product]);

  return null; // This component doesn't render anything
}
