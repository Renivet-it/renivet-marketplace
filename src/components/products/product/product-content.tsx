"use client";

import { ProductCartAddForm } from "@/components/globals/forms";
import { ProductShareModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CachedCart, ProductWithBrand } from "@/lib/validations";
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

// 🔹 Simple seeded random generator
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 🔹 Convert string (id/title) into numeric seed
function stringToSeed(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// 🔹 Generate random rating & reviews per product (consistent per product)
function getRandomRatingAndReviews(seed: number) {
  const rating = Math.round((4.0 + seededRandom(seed) * 0.6) * 10) / 10; // 4.0–4.6
  const reviews = Math.floor(seededRandom(seed + 1) * 71) + 10; // 10–80
  return { rating, reviews };
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

  const { data: brandDetails } =
    trpc.general.addresses.getBrandConfidential.useQuery({
      brandId: product.brand.id,
    });

  const { data: user } = trpc.general.users.currentUser.useQuery();

  // 🔹 Generate unique seed from product.id or title
  const seed = stringToSeed(product.id || product.title);
  const { rating, reviews } = getRandomRatingAndReviews(seed);

  // 🔹 Fetch estimated delivery date
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
            const estimatedDateStr =
              result.data.data.available_courier_companies[0].etd;

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
            setError(
              result.message || "No delivery options available for this pincode."
            );
          }
        } catch (err) {
          console.error("Failed to fetch delivery estimate:", err);
          setError("Failed to fetch delivery estimate. Please try again.");
        }
      });
    }
  }, [user, brandDetails]);

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

          {/* ⭐ Rating + Reviews + Brand */}
          <div className="flex items-center gap-4">
            {/* Stars */}
            <div className="flex items-center text-yellow-500">
              {[...Array(5)].map((_, i) => {
                const starValue = i + 1;
                if (rating >= starValue) {
                  return (
                    <Icons.Star key={i} className="w-4 h-4 fill-current" />
                  ); // full star
                } else if (rating >= starValue - 0.5) {
                  return (
                    <Icons.StarHalf key={i} className="w-4 h-4 fill-current" />
                  ); // half star
                } else {
                  return (
                    <Icons.Star key={i} className="w-4 h-4 text-gray-300" />
                  ); // empty star
                }
              })}
            </div>

            {/* Rating & Reviews */}
            <span className="text-gray-700 text-sm">
              {rating} • {reviews} reviews
            </span>

            {/* Brand */}
            <span className="bg-green-50 text-green-700 text-xs md:text-sm font-medium px-3 py-1 rounded-full border border-green-200">
              {product.brand.name}
            </span>
          </div>
        </div>

        {/* Cart Add Form */}
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

        <Separator />
        <ProductCard />
      </div>

      <ProductShareModal
        isOpen={isProductShareModalOpen}
        setIsOpen={setIsProductShareModalOpen}
        product={product}
      />
    </>
  );
}
