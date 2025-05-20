"use client";

import { ProductCartAddForm } from "@/components/globals/forms";
import { ProductShareModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CachedCart, ProductWithBrand } from "@/lib/validations";
import Link from "next/link";
import { ProductDetails } from "./product-detais";
import { DeliveryOption } from "./product-delivery";
import { trpc } from "@/lib/trpc/client";
import { useState, useEffect, useTransition } from "react";
import { getEstimatedDelivery } from "@/actions/shiprocket/get-estimate-delivery";

interface PageProps extends GenericProps {
    initialCart?: CachedCart[];
    product: ProductWithBrand;
    isWishlisted: boolean;
    userId?: string;
}

export function ProductContent({
    className,
    initialCart,
    product,
    isWishlisted,
    userId,
    ...props
}: PageProps) {
    const [isProductShareModalOpen, setIsProductShareModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [zipCode, setZipCode] = useState<string | null>(null);
    const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");

    const { data: brandDetails, isPending: isBrandFetching, error: brandError } =
        trpc.general.addresses.getBrandConfidential.useQuery(
            { brandId: product.brand.id },
        );

    const { data: user, isPending: isUserFetching } = trpc.general.users.currentUser.useQuery();

    // Fetch estimated delivery date when component mounts
    useEffect(() => {
        if (user?.addresses[0]?.zip && brandDetails?.warehousePostalCode) {
            startTransition(async () => {
                try {
                    setError(""); // Reset error state
                    const result = await getEstimatedDelivery({
                        pickupPostcode: Number(brandDetails.warehousePostalCode),
                        deliveryPostcode: Number(user.addresses[0].zip),
                    });

                    if (result?.data?.data?.available_courier_companies?.length > 0) {
                        const estimatedDateStr = result.data.data.available_courier_companies[0].etd;

                        if (!estimatedDateStr) {
                            setError("Unable to retrieve estimated delivery date.");
                            return;
                        }

                        const estimatedDate = new Date(estimatedDateStr);
                        const today = new Date();

                        if (isNaN(estimatedDate.getTime())) {
                            setError("Invalid estimated delivery date received.");
                            return;
                        }

                        if (estimatedDate <= today) {
                            setError("Estimated delivery date must be in the future.");
                            return;
                        }

                        const formattedDate = estimatedDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                        });
                        setZipCode(user.addresses[0].zip);
                        setEstimatedDelivery(formattedDate);
                    } else {
                        setError(result.message || "No delivery options available for this pincode.");
                    }
                } catch (err) {
                    console.error("Failed to fetch delivery estimate:", err);
                    setError("Failed to fetch delivery estimate. Please try again.");
                }
            });
        }
    }, [user, brandDetails]);

    console.log("brandDetails:", brandDetails);

    return (
        <>
            <div className={cn("", className)} {...props}>
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="text-2xl font-semibold md:text-4xl">
                            {product.title}
                        </h2>
                        <button
                            className="mt-2"
                            onClick={() => setIsProductShareModalOpen(true)}
                        >
                            <span className="sr-only">Share</span>
                            <Icons.Share className="size-5" />
                        </button>
                    </div>
                    <p>
                        <Link
                            href={`/brands/${product.brand.id}`}
                            className="bg-accent p-1 px-2 text-xs text-accent-foreground md:text-sm"
                        >
                            {product.brand.name}
                        </Link>
                    </p>
                </div>
                <Separator />
                <ProductCartAddForm
                    product={product}
                    isWishlisted={isWishlisted}
                    initialCart={initialCart}
                    userId={userId}
                />
                <Separator />
                <DeliveryOption
                    initialZipCode={user?.addresses[0]?.zip}
                    warehousePincode={brandDetails?.warehousePostalCode}
                    estimatedDelivery={estimatedDelivery}
                    setZipCode={setZipCode}
                    setEstimatedDelivery={setEstimatedDelivery}
                />
                <Separator />
                <ProductDetails product={product} />
            </div>
            <ProductShareModal
                isOpen={isProductShareModalOpen}
                setIsOpen={setIsProductShareModalOpen}
                product={product}
            />
        </>
    );
}