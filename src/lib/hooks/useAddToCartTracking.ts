"use client";

import { trackAddToCartCapi } from "@/actions/analytics";
import { trackAddToCart } from "@/actions/track-product";
import { fbEvent } from "@/lib/fbpixel";
import { useGuestPopupStore } from "@/lib/store/use-guest-popup-store";
import { convertPaiseToRupees, getAbsoluteURL } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useCallback } from "react";

export interface TrackAddToCartParams {
    productId: string;
    brandId: string;
    productTitle: string;
    brandName?: string;
    productPrice: number; // expecting value in paise
    quantity?: number;
}

export function useAddToCartTracking() {
    const { user } = useUser();
    const { openPopup } = useGuestPopupStore();

    const trackAddToCartEvent = useCallback(
        async ({
            productId,
            brandId,
            productTitle,
            brandName,
            productPrice,
            quantity = 1,
        }: TrackAddToCartParams) => {
            try {
                // Trigger discount popup for guests
                if (!user) {
                    openPopup();
                }

                // Tracking product in DB
                await trackAddToCart(productId, brandId);

                // 🔹 Generate Event ID
                const eventId = crypto.randomUUID();

                // FB expects value in Rupees but converted
                const parsedPrice =
                    parseFloat(convertPaiseToRupees(productPrice)) * quantity;

                // 🔹 FB Pixel (Client)
                fbEvent(
                    "AddToCart",
                    {
                        content_ids: [productId],
                        content_name: productTitle,
                        content_category: brandName || "Unknown Brand",
                        content_type: "product",
                        value: parsedPrice,
                        currency: "INR",
                        brand_id: brandId,
                        quantity: quantity,
                    },
                    { eventId }
                );

                // 🔹 CAPI (Server)
                const userData = {
                    em: user?.primaryEmailAddress?.emailAddress,
                    ph: user?.primaryPhoneNumber?.phoneNumber,
                    fn: user?.firstName ?? undefined,
                    ln: user?.lastName ?? undefined,
                    external_id: user?.id,
                    fb_login_id: user?.externalAccounts.find(
                        (acc: any) => acc.provider === "oauth_facebook"
                    )?.providerUserId,
                };

                // CAPI Server Side tracking
                trackAddToCartCapi(
                    eventId,
                    userData,
                    {
                        content_ids: [productId],
                        content_name: productTitle,
                        content_category: brandName || "Unknown Brand",
                        content_type: "product",
                        value: parsedPrice,
                        currency: "INR",
                    },
                    getAbsoluteURL(window.location.href) // Send current URL
                ).catch((err) => console.error("CAPI Error:", err));
            } catch (error) {
                console.error("Failed to track AddToCart:", error);
            }
        },
        [user, openPopup]
    );

    return { trackAddToCartEvent };
}
