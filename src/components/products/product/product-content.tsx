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
               <div className="max-w-4xl mx-auto p-8 rounded-3xl border-4 bg-[#f4f0ec] border-grey-900">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">🌱</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Decodex - Behind The Product
        </h1>
      </div>
      <p className="text-gray-600 mb-8 text-base leading-relaxed">
        With Total Transparency, We Want To Tell Our Community The Story And The Impact Behind Every Single Product To Help You Make Better And Conscious Decisions.
      </p>

      {/* Product Values Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 underline decoration-2 underline-offset-4">Product Values</h2>
          <Icons.ChevronUp className="w-6 h-6 text-gray-600" />
        </div>

        {/* Two Cards with Circular Progress */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Water Saved Card */}
          <div className="bg-[#f4f0ec] rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-6">
              <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#22c55e"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.64} ${2 * Math.PI * 40}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">64%</span>
                  <span className="text-sm text-gray-600">Saved</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Water Saved</h3>
                <p className="text-gray-700 mb-2">80 L Compared To Fast Fashion</p>
                <p className="text-gray-400 text-sm">how do we calculate this?</p>
              </div>
            </div>
          </div>

          {/* Fewer Toxic Compounds Card */}
          <div className="bg-[#f4f0ec] rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-6">
              <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#22c55e"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.08} ${2 * Math.PI * 40}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">8%</span>
                  <span className="text-sm text-gray-600">Saved</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fewer Toxic Compounds</h3>
                <p className="text-gray-700 mb-2">78.9 Units Vs. Baseline</p>
                <p className="text-gray-400 text-sm">how do we calculate this?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Row */}
        <div className="grid grid-cols-6 gap-3 mb-8">
          <div className="bg-[#f4f0ec] rounded-full px-4 py-3 text-center border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">water saved</p>
            <p className="font-semibold text-gray-900">2,500l</p>
          </div>
          <div className="bg-[#f4f0ec] rounded-full px-4 py-3 text-center border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">co₂ avoided</p>
            <p className="font-semibold text-gray-900">1.2kg</p>
          </div>
          <div className="bg-[#f4f0ec] rounded-full px-4 py-3 text-center border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">plastic</p>
            <p className="font-semibold text-gray-900">0%</p>
          </div>
          <div className="bg-[#f4f0ec] rounded-full px-4 py-3 text-center border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">water saved</p>
            <p className="font-semibold text-gray-900">2,500l</p>
          </div>
          <div className="bg-[#f4f0ec] rounded-full px-4 py-3 text-center border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">co₂ avoided</p>
            <p className="font-semibold text-gray-900">1.2kg</p>
          </div>
          <div className="bg-[#f4f0ec] rounded-full px-4 py-3 text-center border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">plastic</p>
            <p className="font-semibold text-gray-900">0%</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-900 w-24 font-medium">Softness</span>
            <div className="flex-1 bg-gray-300 rounded-full h-3 relative">
              <div className="bg-amber-800 h-3 rounded-full" style={{width: '80%'}}></div>
            </div>
            <span className="text-sm font-semibold text-gray-900 w-8">4/5</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-900 w-24 font-medium">Breathability</span>
            <div className="flex-1 bg-gray-300 rounded-full h-3 relative">
              <div className="bg-amber-800 h-3 rounded-full" style={{width: '100%'}}></div>
            </div>
            <span className="text-sm font-semibold text-gray-900 w-8">5/5</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-900 w-24 font-medium">Transparency</span>
            <div className="flex-1 bg-gray-300 rounded-full h-3 relative">
              <div className="bg-amber-800 h-3 rounded-full" style={{width: '20%'}}></div>
            </div>
            <span className="text-sm font-semibold text-gray-900 w-8"></span>
          </div>
        </div>
      </div>

      {/* Product Journey Section */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 underline decoration-2 underline-offset-4">Product Journey</h2>
          <Icons.ChevronDown className="w-6 h-6 text-gray-600" />
        </div>

        {/* Vertical Timeline */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 rounded-full border-4 border-white shadow-sm"></div>
            <div className="ml-4 h-0.5 w-16 bg-gray-300"></div>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 rounded-full border-4 border-white shadow-sm"></div>
            <div className="ml-4 h-0.5 w-16 bg-gray-300"></div>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 rounded-full border-4 border-white shadow-sm"></div>
          </div>
        </div>
      </div>
    </div>
            </div>
            <ProductShareModal
                isOpen={isProductShareModalOpen}
                setIsOpen={setIsProductShareModalOpen}
                product={product}
            />
        </>
    );
}