"use client";

import { Icons } from "@/components/icons";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import { siteConfig } from "@/config/site";
import { cn, getAbsoluteURL, normalizeBrandName } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { Mail, MessageCircle, Send, Share2 } from "lucide-react";
import Link from "next/link";
import { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { toast } from "sonner";

interface PageProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    product: ProductWithBrand | any;
}

function buildTrackedProductUrl(product: ProductWithBrand | any) {
    const baseUrl = getAbsoluteURL(
        product?.slug ? `/products/${product.slug}` : "/shop"
    );
    const url = new URL(baseUrl);
    url.searchParams.set("utm_source", "share");
    url.searchParams.set("utm_medium", "product-share");
    url.searchParams.set("utm_campaign", product?.slug ?? "product");
    return url.toString();
}

export function ProductShareModal({ isOpen, setIsOpen, product }: PageProps) {
    const shareUrl = useMemo(() => buildTrackedProductUrl(product), [product]);
    const brandName = normalizeBrandName(product?.brand?.name ?? siteConfig.name);
    const shareMessage = `${product?.title} by ${brandName} on ${siteConfig.name} ${shareUrl}`;
    const shareTitle = `${product?.title} by ${brandName}`;

    useEffect(() => {
        if (!isOpen || typeof window === "undefined") return;
        if (!("share" in navigator) || window.innerWidth >= 768) return;

        navigator
            .share({
                title: shareTitle,
                text: shareMessage,
                url: shareUrl,
            })
            .catch(() => null)
            .finally(() => setIsOpen(false));
    }, [isOpen, setIsOpen, shareMessage, shareTitle, shareUrl]);

    const desktopActions = [
        {
            label: "WhatsApp",
            href: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
            icon: MessageCircle,
        },
        {
            label: "Email",
            href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareMessage)}`,
            icon: Mail,
        },
        {
            label: "Facebook",
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            icon: Icons.Facebook,
        },
        {
            label: "X",
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
            icon: Icons.X_Twitter,
        },
        {
            label: "Telegram",
            href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
            icon: Send,
        },
        {
            label: "Pinterest",
            href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareTitle)}`,
            icon: Icons.Pin,
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share this product</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <p className="text-sm leading-6 text-neutral-600">
                        Share via WhatsApp, Facebook, email, or copy the tracked product link.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        {desktopActions.map(({ label, href, icon: Icon }) => (
                            <Link
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                    "flex h-12 items-center justify-center gap-2 rounded-full border border-neutral-200 text-sm font-semibold transition-colors hover:bg-neutral-50"
                                )}
                            >
                                <Icon className="size-4" />
                                {label}
                            </Link>
                        ))}
                        <button
                            type="button"
                            className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-black"
                            onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                toast.success("Link copied to clipboard");
                            }}
                        >
                            <Share2 className="size-4" />
                            Copy link
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
