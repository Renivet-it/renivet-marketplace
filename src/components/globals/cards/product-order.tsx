"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { OrderWithItemAndBrand } from "@/lib/validations";
import { OrderShipment } from "@/lib/validations/order-shipment";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends GenericProps {
    item: OrderWithItemAndBrand["items"][number];
    trackingInfo?: {
        trackingNumber?: string | null;
        awbNumber?: string | null;
        estimatedDelivery?: Date | null;
    };
    serverNow?: Date;
    shipmentDetails: OrderShipment | undefined;
}

export function ProductOrderCard({
    className,
    item,
    trackingInfo,
    serverNow,
    shipmentDetails,
    ...props
}: PageProps) {
    const itemMedia = item.product.media?.[0]?.mediaItem ?? null;
    const imageUrl =
        itemMedia?.url ??
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
    const imageAlt = itemMedia?.alt ?? item.product.title;

    const itemPrice =
        item.variantId && item.product.variants.length > 0
            ? !!item.product.variants.find(
                  (variant) => variant.id === item.variantId
              )
                ? item.product.variants.find(
                      (variant) => variant.id === item.variantId
                  )!.price!
                : item.product.price!
            : item.product.price!;

    const isAvailable =
        item.product.verificationStatus === "approved" &&
        !item.product.isDeleted &&
        item.product.isAvailable &&
        (!!item.product.quantity ? item.product.quantity > 0 : true) &&
        (!item.variant ||
            (item.variant &&
                !item.variant.isDeleted &&
                item.variant.quantity > 0));

    function canReturnItem(
        shipmentDate: string | Date | null | undefined,
        returnPeriod: number | null | undefined,
        serverNow: Date | undefined
    ): boolean {
        if (!shipmentDate || !returnPeriod || !serverNow) return false;

        const shipment = new Date(shipmentDate);
        const returnDeadline = new Date(shipment);
        returnDeadline.setDate(returnDeadline.getDate() + returnPeriod);

        console.log("⏱️ return deadline:", returnDeadline);
        console.log("📦 shipment:", shipment);
        console.log("🕒 serverNow:", serverNow);

        return serverNow <= returnDeadline;
    }

    const canReturn =
        item.returnExchangePolicy?.returnable &&
        canReturnItem(
            shipmentDetails?.shipmentDate,
            item.returnExchangePolicy?.returnPeriod,
            serverNow
        );

    const canExchange =
        item.returnExchangePolicy?.exchangeable &&
        canReturnItem(
            shipmentDetails?.shipmentDate,
            item.returnExchangePolicy?.exchangePeriod,
            serverNow
        );

    return (
        <div
            key={item.id}
            className={cn(
                "relative flex flex-col gap-3 border p-4 md:flex-row md:gap-5 md:p-6",
                className
            )}
            {...props}
        >
            <div className="group relative aspect-[4/5] size-full max-w-36 shrink-0">
                <Image
                    src={imageUrl}
                    alt={imageAlt}
                    width={1000}
                    height={1000}
                    className="size-full object-cover"
                />
            </div>

            <div className="w-full space-y-2 md:space-y-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold leading-tight md:text-2xl md:leading-normal">
                        <Link
                            href={`/products/${item.product.slug}`}
                            target="_blank"
                            referrerPolicy="no-referrer"
                        >
                            {item.product.title}
                        </Link>
                    </h2>

                    <p className="w-min bg-accent p-1 px-2 text-xs text-accent-foreground">
                        <Link href={`/brands/${item.product.brand.id}`}>
                            {item.product.brand.name}
                        </Link>
                    </p>
                </div>

                <div className="flex">
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">
                        Qty: {item.quantity}
                    </div>
                </div>

                <div className="text-lg font-semibold md:text-xl">
                    {formatPriceTag(
                        parseFloat(convertPaiseToRupees(itemPrice)),
                        true
                    )}
                </div>

                <div>
                    {item.variantId && (
                        <>
                            {item.product.options.map((option) => {
                                const selectedValue =
                                    item.product.variants.find(
                                        (v) => v.id === item.variantId
                                    )?.combinations[option.id];
                                const optionValue = option.values.find(
                                    (v) => v.id === selectedValue
                                );

                                return (
                                    <p key={option.id} className="text-sm">
                                        <span className="font-semibold">
                                            {option.name}:{" "}
                                        </span>
                                        {optionValue?.name}
                                    </p>
                                );
                            })}
                        </>
                    )}
                    <p className="text-sm">
                        <span className="font-semibold">Added on: </span>
                        {format(new Date(item.createdAt), "MMM dd, yyyy")}
                    </p>{" "}
                </div>
                <div className="flex gap-2">
                    {canReturn && (
                        <Button
                            className="flex-1 md:flex-none"
                            variant="outline"
                            size="sm"
                            onClick={() => ""}
                        >
                            Return
                        </Button>
                    )}
                    {canExchange && (
                        <Button
                            className="flex-1 md:flex-none"
                            variant="outline"
                            size="sm"
                            onClick={() => ""}
                        >
                            Exchange
                        </Button>
                    )}
                </div>
            </div>

            {trackingInfo && trackingInfo.estimatedDelivery && (
                <div className="absolute right-4 top-4 text-xs text-muted-foreground">
                    Expected delivery:{" "}
                    {format(
                        new Date(trackingInfo.estimatedDelivery),
                        "MMM dd, yyyy"
                    )}
                </div>
            )}
        </div>
    );
}
