const PRODUCT_CLICK_ENDPOINT = "/api/products/track-click";

export function sendProductClickEvent(productId: string, brandId: string) {
    const payload = JSON.stringify({ productId, brandId });

    try {
        if (
            typeof navigator !== "undefined" &&
            typeof navigator.sendBeacon === "function"
        ) {
            const blob = new Blob([payload], {
                type: "application/json",
            });
            navigator.sendBeacon(PRODUCT_CLICK_ENDPOINT, blob);
            return;
        }

        void fetch(PRODUCT_CLICK_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
        }).catch((error) => {
            console.error("Failed to track click:", error);
        });
    } catch (error) {
        console.error("Failed to track click:", error);
    }
}
