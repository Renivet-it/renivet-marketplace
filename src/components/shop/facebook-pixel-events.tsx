"use client";

import { POSTHOG_EVENTS } from "@/config/posthog";
import { fbEvent } from "@/lib/fbpixel";
import { convertPaiseToRupees } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

interface UserData {
    em?: string;
    ph?: string;
    fn?: string;
    ln?: string;
    db?: string;
    ge?: string;
    ct?: string;
    st?: string;
    zp?: string;
    country?: string;
    external_id?: string;
    fb_login_id?: string;
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
    const posthog = usePostHog();

    useEffect(() => {
        const price = parseFloat(
            convertPaiseToRupees(
                product.costPerItem
                    ? product.costPerItem
                    : product.variants?.[0]?.price
                      ? product.variants[0].price
                      : 0
            )
        );

        posthog?.capture(POSTHOG_EVENTS.COMMERCE.PRODUCT_VIEWED, {
            product_id: product.id,
            brand_id: product.brandId,
            product_title: product.title,
            brand_name: product.brand?.name,
            category_id: product.categoryId,
            price,
            currency: "INR",
        });

        // Add a small delay to ensure pixel is loaded
        const timer = setTimeout(() => {
            if (product && typeof window !== "undefined" && window.fbq) {
                fbEvent(
                    "ViewContent",
                    {
                        content_ids: [product.id],
                        content_name: product.title,
                        content_type: product.productHasVariants
                            ? "product_group"
                            : "product",
                        value: price,
                        currency: "INR",
                        content_category: product.brand?.name || "Unknown Brand",
                        ...userData,
                    },
                    { eventId }
                );
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [product, userData, eventId, posthog]);

    return null;
}

