"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Copy, Eye, Package, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface CustomizationRequestModalProps {
    order: {
        id: string;
        items?: Array<{
            id: string;
            quantity?: number;
            customizationRequest?: string | null;
            product?: {
                id?: string;
                title?: string;
                customizationAvailable?: boolean;
                brand?: {
                    id?: string;
                    name?: string;
                };
                media?: Array<{
                    mediaItem?: {
                        url?: string;
                    };
                }>;
            };
        }>;
    };
}

export function CustomizationRequestModal({ order }: CustomizationRequestModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

    const itemsWithRequest = order.items?.filter(
        (item) => !!item.customizationRequest?.trim()
    );

    if (!itemsWithRequest || itemsWithRequest.length === 0) return null;

    const handleCopy = (text: string, itemId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedItemId(itemId);
        toast.success("Customization request text copied!");
        setTimeout(() => setCopiedItemId(null), 2000);
    };

    const firstRequestText = itemsWithRequest[0]?.customizationRequest || "";

    return (
        <>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                title={`Click to view customization request: ${firstRequestText}`}
                className="group inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900 shadow-sm transition-all hover:bg-amber-200 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
            >
                <Sparkles className="size-3 text-amber-600 shrink-0" />
                <span>Customized Request Raised</span>
                <Eye className="size-3.5 text-amber-700 opacity-80 transition-opacity group-hover:opacity-100 shrink-0 ml-0.5" />
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <Sparkles className="size-5 text-amber-500 shrink-0" />
                            Customization Request Details
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-1">
                        <div className="flex items-center justify-between rounded-lg border border-amber-200/80 bg-amber-50/50 px-3.5 py-2 text-xs">
                            <span className="text-slate-600">
                                Order ID: <strong className="font-semibold text-slate-900">{order.id}</strong>
                            </span>
                            <Badge
                                variant="outline"
                                className="border-amber-300 bg-amber-100 font-semibold text-amber-900"
                            >
                                {itemsWithRequest.length} Custom Item{itemsWithRequest.length > 1 ? "s" : ""}
                            </Badge>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                            {itemsWithRequest.map((item) => {
                                const imageUrl = item.product?.media?.[0]?.mediaItem?.url;
                                const isCopied = copiedItemId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3 shadow-xs"
                                    >
                                        <div className="flex gap-3 items-center">
                                            {imageUrl ? (
                                                <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-slate-200">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={item.product?.title || "Product image"}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
                                                    <Package className="size-6" />
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1 space-y-0.5">
                                                <h4 className="font-semibold text-sm text-slate-900 truncate">
                                                    {item.product?.title || "Custom Product"}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                    <span>Brand: <strong>{item.product?.brand?.name || "N/A"}</strong></span>
                                                    <span>•</span>
                                                    <span>Qty: <strong>{item.quantity ?? 1}</strong></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-md border border-amber-200 bg-amber-50/80 p-3 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-amber-950 flex items-center gap-1">
                                                    <Sparkles className="size-3.5 text-amber-600" />
                                                    Customer Instructions:
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 px-2 text-[11px] font-medium border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200 cursor-pointer"
                                                    onClick={() =>
                                                        handleCopy(
                                                            item.customizationRequest || "",
                                                            item.id
                                                        )
                                                    }
                                                >
                                                    <Copy className="size-3 mr-1" />
                                                    {isCopied ? "Copied!" : "Copy Request"}
                                                </Button>
                                            </div>
                                            <p className="text-xs sm:text-sm font-medium text-amber-950 whitespace-pre-wrap break-words leading-relaxed">
                                                {item.customizationRequest}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
