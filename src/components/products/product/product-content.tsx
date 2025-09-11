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
import { ProductCard } from "../product/product-static";
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
               <div className="space-y-3 border-b border-gray-200 pb-4">
  {/* Title + Share */}
  <div className="flex items-start justify-between">
    <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
      {product.title}
    </h2>
    <button
      className="text-gray-600 hover:text-gray-900"
      onClick={() => setIsProductShareModalOpen(true)}
    >
      <span className="sr-only">Share</span>
      <Icons.Share className="w-5 h-5" />
    </button>
  </div>

  {/* Rating + Reviews + Brand */}
  <div className="flex items-center gap-4">
    {/* Stars */}
    <div className="flex items-center text-yellow-500">
      <Icons.Star className="w-4 h-4 fill-current" />
      <Icons.Star className="w-4 h-4 fill-current" />
      <Icons.Star className="w-4 h-4 fill-current" />
      <Icons.Star className="w-4 h-4 fill-current" />
      <Icons.StarHalf className="w-4 h-4 fill-current" />
    </div>
    <span className="text-gray-700 text-sm">
      4.6 • 128 reviews
    </span>
    <span className="bg-green-50 text-green-700 text-xs md:text-sm font-medium px-3 py-1 rounded-full border border-green-200">
      {product.brand.name}
    </span>
  </div>
</div>
                <ProductCartAddForm
                    product={product}
                    isWishlisted={isWishlisted}
                    initialCart={initialCart}
                    userId={userId}
                    initialZipCode={user?.addresses[0]?.zip}
                    warehousePincode={brandDetails?.warehousePostalCode}
                    estimatedDelivery={estimatedDelivery}
                    setZipCode={setZipCode}
                    setEstimatedDelivery={setEstimatedDelivery}
                />
                <div className="space-y-2 mt-4">
                {[
                  { icon: <Icons.Recycle className="w-4 h-4" />, text: "Plastic-Free Packaging" },
                  { icon: <Icons.Droplet className="w-4 h-4" />, text: "Low-Water Dye" },
                  { icon: <Icons.RotateCw className="w-4 h-4" />, text: "15-Day Returns" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-[#E0E2E1] rounded-full px-4 py-2 text-sm font-medium"
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
                {/* <DeliveryOption
                    initialZipCode={user?.addresses[0]?.zip}
                    warehousePincode={brandDetails?.warehousePostalCode}
                    estimatedDelivery={estimatedDelivery}
                    setZipCode={setZipCode}
                    setEstimatedDelivery={setEstimatedDelivery}
                /> */}
                <Separator />
    <ProductCard/>
            </div>
            <ProductShareModal
                isOpen={isProductShareModalOpen}
                setIsOpen={setIsProductShareModalOpen}
                product={product}
            />
        </>
    );
}