// lib/utils/wishlist.ts
import { toast } from "sonner";

export function addToGuestWishlist(item: any, imageUrl: string, itemPrice: number) {
    try {
        const existingWishlist = JSON.parse(localStorage.getItem("guest_wishlist") || "[]");

        const alreadyInWishlist = existingWishlist.some(
            (w: any) => w.product?.id === item?.product?.id && w.variantId === item?.variantId
        );

        if (!alreadyInWishlist) {
            existingWishlist.push({
                ...item, // store the whole item object
                fallbackImage: imageUrl, // extra fallback image (safe for UI)
                fallbackPrice: itemPrice // extra price (safe for UI)
            });

            localStorage.setItem("guest_wishlist", JSON.stringify(existingWishlist));
        }

        toast.success("Added to wishlist");
    } catch (err) {
        console.error(err);
        toast.error("Failed to add to wishlist");
    }
}
