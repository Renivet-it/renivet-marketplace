"use client";

import {
    menToggleFeaturedProduct,
    newEventPageSection,
    toggleBeautyNewArrivalSection,
    toggleBeautyTopPickSection,
    toggleFeaturedProduct,
    toggleHomeAndLivingNewArrivalsSection,
    toggleHomeAndLivingTopPicksSection,
    toggleHomeNewArrivalsProduct,
    toggleKidsFetchSection,
    toggleMenStyleWithSubstance,
    toggleWomenStyleWithSubstance,
} from "@/actions/product-action";
import {
    ProductActivationModal,
    ProductAvailablityModal,
    ProductDeleteModal,
    ProductPublishModal,
    ProductRejectionViewModal,
    ProductSendReviewModal,
} from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { TableProduct as ReviewTableProduct } from "./products-review-table";

// The categories for the "New Arrivals" section
const NEW_ARRIVALS_CATEGORIES = [
    "Most Ordered",
    "In Season",
    "Fresh Deals",
    "Limited Offer",
    "Best Value",
    "Swipe Left or Right",
];

interface PageProps {
    product: ReviewTableProduct & {
        visibility: boolean;
        stock: number;
        isFeaturedWomen?: boolean;
        isFeaturedMen?: boolean;
        isStyleWithSubstanceWoMen?: boolean;
        isStyleWithSubstanceMen?: boolean;
        iskidsFetchSection?: boolean;
        isHomeAndLivingSectionNewArrival?: boolean;
        isHomeAndLivingSectionTopPicks?: boolean;
        isBeautyNewArrival?: boolean;
        isBeautyTopPicks?: boolean;
        // CORRECTED: This prop now holds the category string or null
        homeNewArrivalCategory?: string | null;
        isAddedInEventProductPage?: boolean;
    };
}

export function ProductAction({ product }: PageProps) {
    const [isRejectionViewModalOpen, setIsRejectionViewModalOpen] =
        useState(false);
    const [isSendForReviewModalOpen, setIsSendForReviewModalOpen] =
        useState(false);
    const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
    const [isAvailablityModalOpen, setIsAvailablityModalOpen] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    const { refetch } = trpc.brands.products.getProducts.useQuery({
        limit,
        page,
        search,
    });

    // CORRECTED: This handler now sends the category string to the updated server action
    // const handletoggleHomeNewArrivalsProduct = async (category: string) => {
    //     setIsLoading(true);
    //     // If the product is already in this category, clicking again will remove it.
    //     // Otherwise, it will add/update it to the new category.
    //     const isCurrentlySelected = product.homeNewArrivalCategory === category;

    //     try {
    //         const result = await toggleHomeNewArrivalsProduct(
    //             product.id,
    //             !isCurrentlySelected, // This boolean tells the backend if the product should be active or not
    //             category
    //         );

    //         if (result.success) {
    //             refetch();
    //             toast.success(result.message);
    //         } else {
    //             toast.error(result.error);
    //         }
    //     } catch (error) {
    //         toast.error("Failed to update New Arrivals status");
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };
    const handletoggleHomeNewArrivalsProduct = async (
  category: string,
  isActive: boolean // <-- added this
) => {
  setIsLoading(true);

  try {
    const result = await toggleHomeNewArrivalsProduct(
      product.id,
      isActive, // directly use the param
      category
    );

    if (result.success) {
      refetch();
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  } catch (error) {
    toast.error("Failed to update New Arrivals status");
  } finally {
    setIsLoading(false);
  }
};


    // --- All other handler functions remain unchanged ---
    const handleToggleFeatured = async () => {
        setIsLoading(true);
        try {
            const result = await toggleFeaturedProduct(
                product.id,
                product.isFeaturedWomen ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update featured status");
        } finally {
            setIsLoading(false);
        }
    };
    const handleToggleFeaturedMen = async () => {
        setIsLoading(true);
        try {
            const result = await menToggleFeaturedProduct(
                product.id,
                product.isFeaturedMen ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update featured status");
        } finally {
            setIsLoading(false);
        }
    };
    const handleToggleWomenStyleWithSubstance = async () => {
        setIsLoading(true);
        try {
            const result = await toggleWomenStyleWithSubstance(
                product.id,
                product.isStyleWithSubstanceWoMen ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update Style With Substance status");
        } finally {
            setIsLoading(false);
        }
    };
    const handleToggleMenStyleWithSubstance = async () => {
        setIsLoading(true);
        try {
            const result = await toggleMenStyleWithSubstance(
                product.id,
                product.isStyleWithSubstanceMen ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update Style With Substance status");
        } finally {
            setIsLoading(false);
        }
    };
    const handleToggleKidsFetchProducts = async () => {
        setIsLoading(true);
        try {
            const result = await toggleKidsFetchSection(
                product.id,
                product.iskidsFetchSection ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update Style With Substance status");
        } finally {
            setIsLoading(false);
        }
    };
    const handletoggleHomeAndLivingNewArrivalsSection = async () => {
        setIsLoading(true);
        try {
            const result = await toggleHomeAndLivingNewArrivalsSection(
                product.id,
                product.isHomeAndLivingSectionNewArrival ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update Style With Substance status");
        } finally {
            setIsLoading(false);
        }
    };
    const handletoggleHomeAndLivingTopPicksSection = async () => {
        setIsLoading(true);
        try {
            const result = await toggleHomeAndLivingTopPicksSection(
                product.id,
                product.isHomeAndLivingSectionTopPicks ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update Style With Substance status");
        } finally {
            setIsLoading(false);
        }
    };
    const handletoggleBeautyNewArrivalSection = async () => {
        setIsLoading(true);
        try {
            const result = await toggleBeautyNewArrivalSection(
                product.id,
                product.isBeautyNewArrival ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update Style With Substance status");
        } finally {
            setIsLoading(false);
        }
    };
    const handletoggleBeautyTopPickSection = async () => {
        setIsLoading(true);
        try {
            const result = await toggleBeautyTopPickSection(
                product.id,
                product.isBeautyTopPicks ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update Style With Substance status");
        } finally {
            setIsLoading(false);
        }
    };
    const handlenewEventPageSectionProduct = async () => {
        setIsLoading(true);
        try {
            const result = await newEventPageSection(
                product.id,
                product.isAddedInEventProductPage ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update Style With Substance status");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="size-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <Icons.MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuGroup>
                        {product.isPublished && (
                            <DropdownMenuItem
                                asChild
                                disabled={!product.isPublished}
                            >
                                <Link
                                    href={`/products/${product.slug}`}
                                    target="_blank"
                                >
                                    <Icons.Eye className="size-4" />
                                    <span>View</span>
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(product.id);
                                toast.success("ID copied to clipboard");
                            }}
                        >
                            <Icons.Copy className="size-4" />
                            <span>Copy ID</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            disabled={product.verificationStatus === "pending"}
                            asChild
                        >
                            <Link
                                href={`/dashboard/general/products/preview-form/${product.id}`}
                                target="_blank"
                            >
                                <Icons.Edit className="size-4" />
                                <span>Edit</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={product.verificationStatus === "pending"}
                            asChild
                        >
                            <Link
                                href={`/dashboard/general/products/${product.id}`}
                            >
                                <Icons.Eye className="size-4" />
                                <span>Review Product</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/dashboard/general/products/preview-form/${product.id}/values`}
                                target="_blank"
                            >
                                <Icons.ShoppingCart className="size-4" />
                                <span>
                                    {product.values
                                        ? "Edit Values"
                                        : "Add Values"}
                                </span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/dashboard/general/products/preview-form/${product.id}/journey`}
                                target="_blank"
                            >
                                <Icons.Globe className="size-4" />
                                <span>
                                    {product.journey
                                        ? "Edit Journey"
                                        : "Add Journey"}
                                </span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={handleToggleFeatured}
                            disabled={isLoading}
                        >
                            <Icons.Star className="size-4" />
                            <span>
                                {product.isFeaturedWomen
                                    ? "Remove from Featured Women"
                                    : "Add to Featured Women"}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleToggleFeaturedMen}
                            disabled={isLoading}
                        >
                            <Icons.Star className="size-4" />
                            <span>
                                {product.isFeaturedMen
                                    ? "Remove from Featured Men"
                                    : "Add to Featured Men"}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleToggleWomenStyleWithSubstance}
                            disabled={isLoading}
                        >
                            <Icons.Layers className="size-4" />
                            <span>
                                {product.isStyleWithSubstanceWoMen
                                    ? "Remove from Style With Substance (Women)"
                                    : "Add to Style With Substance (Women)"}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleToggleMenStyleWithSubstance}
                            disabled={isLoading}
                        >
                            <Icons.Layers className="size-4" />
                            <span>
                                {product.isStyleWithSubstanceMen
                                    ? "Remove from Style With Substance (Men)"
                                    : "Add to Style With Substance (Men)"}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleToggleKidsFetchProducts}
                            disabled={isLoading}
                        >
                            <Icons.Layers className="size-4" />
                            <span>
                                {product.iskidsFetchSection
                                    ? "Remove from Product Feature (Kids)"
                                    : "Add to Product Feature (Kids)"}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={
                                handletoggleHomeAndLivingNewArrivalsSection
                            }
                            disabled={isLoading}
                        >
                            <Icons.Layers className="size-4" />
                            <span>
                                {product.isHomeAndLivingSectionNewArrival
                                    ? "Remove from New Arrivals (Home living)"
                                    : "Add to New Arrivals (Home living)"}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handletoggleHomeAndLivingTopPicksSection}
                            disabled={isLoading}
                        >
                            <Icons.Layers className="size-4" />
                            <span>
                                {product.isHomeAndLivingSectionTopPicks
                                    ? "Remove from Top Picks(Home living)"
                                    : "Add to Top Picks(Home living)"}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handletoggleBeautyNewArrivalSection}
                            disabled={isLoading}
                        >
                            <Icons.Layers className="size-4" />
                            <span>
                                {product.isBeautyNewArrival
                                    ? "Remove from New Arrivals(Beauty Personal)"
                                    : "Add to New Arrivals(Beauty Personal)"}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handletoggleBeautyTopPickSection}
                            disabled={isLoading}
                        >
                            <Icons.Layers className="size-4" />
                            <span>
                                {product.isBeautyTopPicks
                                    ? "Remove from Top Picks(Beauty Personal)"
                                    : "Add to Top Picks(Beauty Personal)"}
                            </span>
                        </DropdownMenuItem>
                     {/* --- Refactored New Arrivals Section --- */}
{/* --- Fixed New Arrivals Section --- */}
{/* --- Fixed New Arrivals Section --- */}
<DropdownMenuSub>
  <DropdownMenuSubTrigger disabled={isLoading}>
    <Icons.Layers className="mr-2 size-4" />
    <span>New Arrivals (Home Page)</span>
  </DropdownMenuSubTrigger>

  <DropdownMenuPortal>
    <DropdownMenuSubContent>
      <DropdownMenuLabel>Select a Category</DropdownMenuLabel>
      <DropdownMenuSeparator />

      {/* 🟢 Add to Category */}
      {NEW_ARRIVALS_CATEGORIES.map((category) => (
        <DropdownMenuItem
          key={category}
          onClick={() =>
            handletoggleHomeNewArrivalsProduct(category, true) // ✅ add (isActive = true)
          }
          disabled={isLoading}
        >
          {product.homeNewArrivalCategory === category && (
            <Icons.Check className="mr-2 size-4" />
          )}
          <span>{category}</span>
        </DropdownMenuItem>
      ))}

      {/* 🔴 Remove option if already active */}
      {product.isHomeNewArrival && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              handletoggleHomeNewArrivalsProduct(
                product.homeNewArrivalCategory ?? "",
                false // ✅ remove (isActive = false)
              )
            }
            disabled={isLoading}
            className="text-red-600 focus:text-red-600"
          >
            <Icons.Trash className="mr-2 size-4" />
            <span>
              Remove from New Arrivals
              {product.homeNewArrivalCategory
                ? ` (${product.homeNewArrivalCategory})`
                : ""}
            </span>
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuSubContent>
  </DropdownMenuPortal>
</DropdownMenuSub>
{/* --- End of Fixed Section --- */}

{/* --- End of Fixed Section --- */}

                        {/* --- End of Refactored Section --- */}

                        <DropdownMenuItem
                            onClick={handlenewEventPageSectionProduct}
                            disabled={isLoading}
                        >
                            <Icons.Layers className="size-4" />
                            <span>
                                {product.isAddedInEventProductPage
                                    ? "Remove from Event Exibition Page"
                                    : "Add to Event Exibition Page"}
                            </span>
                        </DropdownMenuItem>

                        {product.verificationStatus === "idle" && (
                            <DropdownMenuItem
                                onClick={() =>
                                    setIsSendForReviewModalOpen(true)
                                }
                            >
                                <Icons.Shield className="size-4" />
                                <span>Send for Review</span>
                            </DropdownMenuItem>
                        )}
                        {product.verificationStatus === "rejected" && (
                            <>
                                {" "}
                                <DropdownMenuItem
                                    onClick={() =>
                                        setIsSendForReviewModalOpen(true)
                                    }
                                >
                                    <Icons.Shield className="size-4" />
                                    <span>Resend for Review</span>
                                </DropdownMenuItem>{" "}
                                <DropdownMenuItem
                                    onClick={() =>
                                        setIsRejectionViewModalOpen(true)
                                    }
                                >
                                    <Icons.AlertTriangle className="size-4" />
                                    <span>View Reason</span>
                                </DropdownMenuItem>{" "}
                            </>
                        )}
                        {!product.isPublished &&
                            product.verificationStatus === "approved" && (
                                <DropdownMenuItem
                                    onClick={() => setIsPublishModalOpen(true)}
                                >
                                    <Icons.Send className="size-4" />
                                    <span>Publish Product</span>
                                </DropdownMenuItem>
                            )}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setIsDeleteModalOpen(true)}
                    >
                        <Icons.Trash className="size-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* --- All your existing modals --- */}
            <ProductSendReviewModal
                product={product}
                isOpen={isSendForReviewModalOpen}
                setIsOpen={setIsSendForReviewModalOpen}
                isResend={product.verificationStatus === "rejected"}
            />
            <ProductAvailablityModal
                product={product}
                isOpen={isAvailablityModalOpen}
                setIsOpen={setIsAvailablityModalOpen}
            />
            <ProductActivationModal
                product={product}
                isOpen={isActivationModalOpen}
                setIsOpen={setIsActivationModalOpen}
            />
            <ProductPublishModal
                product={product}
                isOpen={isPublishModalOpen}
                setIsOpen={setIsPublishModalOpen}
            />
            <ProductRejectionViewModal
                product={product}
                isOpen={isRejectionViewModalOpen}
                setIsOpen={setIsRejectionViewModalOpen}
            />
            <ProductDeleteModal
                product={product}
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
            />
        </>
    );
}
