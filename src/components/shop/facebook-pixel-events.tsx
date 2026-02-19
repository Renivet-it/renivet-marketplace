// src/components/analytics/facebook-pixel-events.tsx
"use client";

import { fbEvent } from "@/lib/fbpixel";
import { convertPaiseToRupees } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { useEffect } from "react";

interface UserData {
    em?: string; // Email
    ph?: string; // Phone
    fn?: string; // First Name
    ln?: string; // Last Name
    db?: string; // Date of Birth
    ge?: string; // Gender
    ct?: string; // City
    st?: string; // State
    zp?: string; // Zip/Postal Code
    country?: string; // Country
    external_id?: string; // External ID
    fb_login_id?: string; // Facebook Login ID
}

interface ViewContentProps {
    product: ProductWithBrand;
    userData?: UserData;
    eventId?: string;
}

export function TrackViewContent({
    product,
    userData,
    eventId,
}: ViewContentProps) {
    useEffect(() => {
        // Add a small delay to ensure pixel is loaded
        const timer = setTimeout(() => {
            if (product && typeof window !== "undefined" && window.fbq) {
                fbEvent(
                    "ViewContent",
                    {
                        content_ids: [product.id], // Make sure this matches your product catalog
                        content_name: product.title,
                        content_type: "product",
                        value: parseFloat(
                            convertPaiseToRupees(
                                product.costPerItem
                                    ? product.costPerItem
                                    : product.variants?.[0]?.price
                                      ? product.variants[0].price
                                      : 0.0
                            )
                        ),
                        currency: "INR",
                        content_category:
                            product.brand?.name || "Unknown Brand",
                        ...userData,
                    },
                    { eventId }
                );
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [product, userData, eventId]);

    return null;
}
