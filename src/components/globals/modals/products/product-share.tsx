"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import { siteConfig } from "@/config/site";
import { cn, getAbsoluteURL, normalizeBrandName } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { Mail, MessageCircle, Share2 } from "lucide-react";
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

    useEffect(() => {
        if (!isOpen || typeof window === "undefined") return;
        if (!("share" in navigator) || window.innerWidth >= 768) return;

        navigator
            .share({
                title: `${product?.title} by ${brandName}`,
                text: shareMessage,
                url: shareUrl,
            })
            .catch(() => null)
            .finally(() => setIsOpen(false));
    }, [brandName, isOpen, product?.title, setIsOpen, shareMessage, shareUrl]);

    const desktopActions = [
        {
            label: "WhatsApp",
            href: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
            icon: MessageCircle,
        },
        {
            label: "Email",
            href: `mailto:?subject=${encodeURIComponent(`${product?.title} by ${brandName}`)}&body=${encodeURIComponent(shareMessage)}`,
            icon: Mail,
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
                        Share via WhatsApp, email, or copy the tracked product link.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        {desktopActions.map(({ label, href, icon: Icon }) => (
                            <Link
                                key={label}
                                href={href}
                                target="_blank"
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
