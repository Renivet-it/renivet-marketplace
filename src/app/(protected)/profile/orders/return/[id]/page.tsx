"use client";

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useReturnStore } from "@/lib/store/return-store";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ReturnPageStepper from "./components/return-step-accordian";

export default function Page() {
    return (
        <div className="space-y-5 md:basis-3/4">
            <Card className="w-full rounded-none">
                <CardHeader className="px-4 md:p-6">
                    <CardTitle>Return Order</CardTitle>
                    <CardDescription>
                        Please follow the instructions to return your order.
                    </CardDescription>
                </CardHeader>
            </Card>
            <ReturnPage />
        </div>
    );
}

function ReturnPage() {
    const router = useRouter();
    const returnItem = useReturnStore((state) => state.selectedReturnItem);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (isHydrated && !returnItem) {
            router.replace("/profile/orders");
        }
    }, [isHydrated, returnItem, router]);

    const itemMedia = useMemo(() => {
        if (!returnItem) return null;
        return returnItem.product.media?.[0]?.mediaItem ?? null;
    }, [returnItem]);
    const itemPrice = useMemo(() => {
        if (!returnItem) return null;
        return returnItem.variantId && returnItem.product.variants.length > 0
            ? !!returnItem.product.variants.find(
                  (variant) => variant.id === returnItem.variantId
              )
                ? returnItem.product.variants.find(
                      (variant) => variant.id === returnItem.variantId
                  )!.price!
                : returnItem.product.price!
            : returnItem.product.price!;
    }, [returnItem]);

    const imageUrl =
        itemMedia?.url ??
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
    const imageAlt = itemMedia?.alt ?? returnItem?.product.title;

    if (!isHydrated) return <p>Loading...</p>;
    if (!returnItem) return <p>Loading or invalid item.</p>;

    return (
        <div>
            <ReturnPageProductDetailsHeader
                imageUrl={imageUrl}
                imageAlt={imageAlt}
                productTitle={returnItem.product.title}
                productSlug={returnItem.product.slug}
                productBrandId={returnItem.product.brand.id}
                productBrandName={returnItem.product.brand.name}
                itemQuantity={returnItem.quantity}
                itemPrice={itemPrice as number}
            />
            {/* Use returnItem for details */}
            <ReturnPageStepper className={"mt-4"} />
        </div>
    );
}

interface ReturnPageProductDetailsHeaderProps extends GenericProps {
    imageUrl: string;
    imageAlt?: string;
    productTitle: string;
    productSlug: string;
    productBrandId: string;
    productBrandName: string;
    itemQuantity: string | number;
    itemPrice: number;
}

function ReturnPageProductDetailsHeader({
    imageUrl,
    imageAlt,
    productTitle,
    productSlug,
    productBrandId,
    productBrandName,
    itemQuantity,
    itemPrice,
    ...props
}: ReturnPageProductDetailsHeaderProps) {
    return (
        <>
            <div className="flex w-full space-x-2 md:space-x-4">
                <div
                    className={cn("relative aspect-[4/5] h-[175px] w-[140px]")}
                >
                    <Image
                        src={imageUrl}
                        alt={imageAlt ?? ""}
                        fill
                        className="size-full object-cover"
                    />
                </div>
                <div className="space-y-2 md:space-y-4">
                    <div className="max-w-full">
                        <h2 className="text-wrap text-lg font-semibold leading-tight md:text-2xl md:leading-normal">
                            <Link
                                href={`/products/${productSlug}`}
                                target="_blank"
                                referrerPolicy="no-referrer"
                            >
                                {productTitle.length > 60
                                    ? `${productTitle.slice(0, 54)}...`
                                    : productTitle}
                            </Link>
                        </h2>
                        <p className="w-min bg-accent p-1 px-2 text-xs text-accent-foreground">
                            <Link href={`/brands/${productBrandId}`}>
                                {productBrandName}
                            </Link>
                        </p>
                    </div>
                    <div className="flex">
                        <div className="flex items-center gap-1 bg-muted px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">
                            Qty: {itemQuantity}
                        </div>
                    </div>
                    <div className="text-lg font-semibold md:text-xl">
                        {formatPriceTag(
                            parseFloat(convertPaiseToRupees(itemPrice)),
                            true
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
