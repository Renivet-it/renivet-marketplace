import React from "react";

export type FlyingItem = {
    id: string;
    imageSrc: string;
    startRect: { left: number; top: number; width: number; height: number };
    endRect: { left: number; top: number; width: number; height: number };
};

export const handleCartFlyAnimation = (
    e: React.MouseEvent,
    imageUrl: string,
    targetSelector?: string
) => {
    const button = e.currentTarget as HTMLElement;
    let imageElem: Element | null = null;

    if (targetSelector) {
        imageElem = document.querySelector(targetSelector);
    } else {
        const container =
            button.closest(".group") ||
            button.closest(".product-card-container") ||
            button.closest("div");
        if (container) {
            imageElem = container.querySelector("img");
        }
    }

    const startRect =
        imageElem?.getBoundingClientRect() || button.getBoundingClientRect();
    const cartIcon = document.querySelector(".global-cart-icon");
    const endRect = cartIcon?.getBoundingClientRect() || {
        left: window.innerWidth - 50,
        top: 20,
        width: 24,
        height: 24,
    };

    const detail: FlyingItem = {
        id: Math.random().toString(36).substring(7),
        imageSrc: imageUrl,
        startRect,
        endRect,
    };

    window.dispatchEvent(new CustomEvent("trigger-cart-fly", { detail }));
};
