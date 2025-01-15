"use client";

import { searchProductBySku } from "@/actions";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Spinner } from "@/components/ui/spinner";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";

interface PageProps {
    brandId?: string;
}

export function ProductSearchSkuModal({ brandId }: PageProps) {
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    const {
        mutate: searchBySku,
        status: searchStatus,
        error: searchError,
        data: product,
    } = useMutation({
        mutationFn: async () => {
            const data = await searchProductBySku({
                sku: search,
                brandId,
                isDeleted: false,
            });

            return data;
        },
    });

    return (
        <>
            <Button
                variant="outline"
                className="size-8 p-0"
                onClick={() => setIsSearchModalOpen(true)}
            >
                <span className="sr-only">Search by SKU</span>
                <Icons.Search />
            </Button>

            <Dialog
                open={isSearchModalOpen}
                onOpenChange={setIsSearchModalOpen}
            >
                <DialogContent className="max-w-4xl bg-transparent [&>button]:hidden">
                    <DialogHeader className="hidden">
                        <DialogTitle>Search Product by SKU</DialogTitle>
                    </DialogHeader>

                    <div
                        className={cn(
                            "space-y-4",
                            searchStatus === "idle" && !product && "space-y-0"
                        )}
                    >
                        <div className="flex w-full items-center gap-1 rounded-lg bg-background">
                            <div className="p-2 pl-3">
                                <Icons.Search className="size-5" />
                            </div>

                            <input
                                type="search"
                                className="flex h-12 w-full bg-transparent pr-3 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter the product's Native SKU"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") searchBySku();
                                }}
                                disabled={searchStatus === "pending"}
                            />

                            <div className="p-2 pr-3">
                                <Button
                                    className="size-8 rounded-full"
                                    onClick={() => searchBySku()}
                                    disabled={searchStatus === "pending"}
                                >
                                    <span className="sr-only">Search</span>
                                    <Icons.ArrowUp />
                                </Button>
                            </div>
                        </div>

                        <div
                            className={cn(
                                "flex cursor-pointer items-center justify-between rounded-lg bg-background p-4 transition-all ease-in-out",
                                searchStatus === "idle" &&
                                    !product &&
                                    "h-0 p-0",
                                !!product && "hover:bg-background/95"
                            )}
                            onClick={() => {
                                if (!product) return;

                                window.open(
                                    brandId
                                        ? `/dashboard/brands/${brandId}/products/p/${product.id}`
                                        : `/dashboard/general/products/${product.id}`,
                                    "_blank"
                                );
                            }}
                        >
                            {searchStatus === "pending" && (
                                <div className="flex items-center gap-2">
                                    <Spinner className="size-5" />
                                    <p className="text-sm text-muted-foreground">
                                        Searching for product...
                                    </p>
                                </div>
                            )}

                            {searchStatus === "error" && !!searchError && (
                                <p className="text-error text-sm text-muted-foreground">
                                    {searchError.message}
                                </p>
                            )}

                            {!!product && (
                                <>
                                    <div className="flex cursor-pointer items-center gap-4">
                                        {product.imageUrl ? (
                                            <div className="aspect-square overflow-hidden rounded-sm">
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.title}
                                                    width={64}
                                                    height={64}
                                                    className="size-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-sm border p-4">
                                                <Icons.FileText />
                                            </div>
                                        )}

                                        <div>
                                            <div className="flex items-center gap-2 font-semibold">
                                                <p>{product.title}</p>
                                                <Badge
                                                    className="rounded-none px-1.5 py-px"
                                                    variant="secondary"
                                                >
                                                    {product.brand}
                                                </Badge>
                                            </div>

                                            <p className="text-sm text-muted-foreground">
                                                Variants: {product.variants}
                                            </p>

                                            <p className="text-sm text-muted-foreground">
                                                Price:{" "}
                                                {product.price === 0 &&
                                                product.variants > 0
                                                    ? "Varies"
                                                    : formatPriceTag(
                                                          +convertPaiseToRupees(
                                                              product.price
                                                          ),
                                                          true
                                                      )}
                                            </p>
                                        </div>
                                    </div>

                                    <Icons.ArrowRight className="size-5" />
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
