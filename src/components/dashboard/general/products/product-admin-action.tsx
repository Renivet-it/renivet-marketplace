"use client";

import {
    menToggleFeaturedProduct,
    newEventPageSection,
    toggleBeautyNewArrivalSection,
    toggleBeautyTopPickSection,
    toggleBestSeller,
    toggleFeaturedProduct,
    toggleHomeAndLivingNewArrivalsSection,
    toggleHomeAndLivingTopPicksSection,
    toggleHomeHeroProduct,
    toggleHomeNewArrivalsProduct,
    toggleHomePageProduct,
    toggleUnder999,
    toggleHomeYouMayAlsoLikeProduct,
    toggleHomeYouMayLoveProduct,
    toggleKidsFetchSection,
    toggleMenStyleWithSubstance,
    toggleSummerCollection,
    toggleWomenStyleWithSubstance,
    updateSectionPosition,
    type ProductSectionKey,
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
import { Input } from "@/components/ui/input-general";
import { Label } from "@/components/ui/label";
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
        isHomeHeroProducts?: boolean;
        isHomeLoveTheseProducts?: boolean;
        isHomeYouMayAlsoLikeTheseProducts?: boolean;
        isHomePageProduct?: boolean;
        isBestSeller?: boolean;
        isUnder999?: boolean;
        isSummerCollection?: boolean;
    };
}


function SectionPositionToggle({
    label,
    icon: Icon,
    isActive,
    isLoading,
    sectionKey,
    onToggle,
    onUpdatePosition,
    extraSuffix,
}: {
    label: string;
    icon: any;
    isActive: boolean;
    isLoading: boolean;
    sectionKey: ProductSectionKey;
    onToggle: (position?: number) => Promise<void>;
    onUpdatePosition: (section: ProductSectionKey, position: number) => Promise<void>;
    extraSuffix?: string;
}) {
    const [pos, setPos] = useState<number>(1);
    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={isLoading}>
                <Icon className="mr-2 size-4" />
                <span>{isActive ? `Edit / Remove from ${label}` : `Add to ${label}`}{(extraSuffix ? ` ${extraSuffix}` : "")}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-56 p-2">
                    {isActive ? (
                        <div className="flex flex-col gap-3">
                            <Label className="text-xs font-semibold text-muted-foreground">Update Sequence</Label>
                            <div className="flex items-center gap-2">
                                <Input type="number" min={1} value={pos} onChange={e => setPos(Number(e.target.value))} className="h-8" />
                                <Button size="sm" disabled={isLoading} onClick={() => onUpdatePosition(sectionKey, pos)}>Update</Button>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={isLoading} onClick={() => onToggle()} className="text-red-500 focus:text-red-500 justify-center cursor-pointer">
                                Remove from section
                            </DropdownMenuItem>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <Label className="text-xs font-semibold text-muted-foreground">Select Sequence Position</Label>
                            <div className="flex items-center gap-2">
                                <Input type="number" min={1} value={pos} onChange={e => setPos(Number(e.target.value))} className="h-8" />
                                <Button size="sm" disabled={isLoading} onClick={() => onToggle(pos)}>Confirm Add</Button>
                            </div>
                        </div>
                    )}
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
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
    const [newArrivalsPos, setNewArrivalsPos] = useState<number>(1);

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
    const handleUpdatePosition = async (section: ProductSectionKey, position: number) => {
        setIsLoading(true);
        try {
            const result = await updateSectionPosition(product.id, section, position);
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update position");
        } finally {
            setIsLoading(false);
        }
    };


    const handleToggleBestSeller = async (position?: number) => {
        setIsLoading(true);
        try {
            const result = await toggleBestSeller(product.id, position);
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update Best Seller status");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleUnder999 = async (position?: number) => {
        setIsLoading(true);
        try {
            const result = await toggleUnder999(
                product.id,
                product.isUnder999 ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update Under 999 status");
        } finally {
            setIsLoading(false);
        }
    };

    // CORRECTED: This handler now sends the category string to the updated server action
    const handletoggleHomeNewArrivalsProduct = async (
        category: string,
        isActive: boolean,
        position?: number
    ) => {
        setIsLoading(true);

        try {
            const result = await toggleHomeNewArrivalsProduct(
                product.id,
                isActive,
                category,
                position
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
    const handleToggleFeatured = async (position?: number) => {
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
    const handleToggleFeaturedMen = async (position?: number) => {
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
    const handleToggleWomenStyleWithSubstance = async (position?: number) => {
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

    const handleToggleProductHeroHomePage = async (position?: number) => {
        setIsLoading(true);
        try {
            const result = await toggleHomeHeroProduct(
                product.id,
                product.isHomeHeroProducts ?? false
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

    const handleToggleYouMayLoveThese = async (position?: number) => {
        setIsLoading(true);
        try {
            const result = await toggleHomeYouMayLoveProduct(
                product.id,
                product.isHomeLoveTheseProducts ?? false
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

    const handleToggleYouMayAlsoLikeThese = async (position?: number) => {
        setIsLoading(true);
        try {
            const result = await toggleHomeYouMayAlsoLikeProduct(
                product.id,
                product.isHomeYouMayAlsoLikeTheseProducts ?? false
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

    const handleToggleHomePageMainProduct = async (position?: number) => {
        setIsLoading(true);
        try {
            const result = await toggleHomePageProduct(
                product.id,
                product.isHomePageProduct ?? false
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

    const handleToggleMenStyleWithSubstance = async (position?: number) => {
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
    const handleToggleKidsFetchProducts = async (position?: number) => {
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
    const handletoggleHomeAndLivingNewArrivalsSection = async (position?: number) => {
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
    const handletoggleHomeAndLivingTopPicksSection = async (position?: number) => {
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
    const handletoggleBeautyNewArrivalSection = async (position?: number) => {
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
    const handletoggleBeautyTopPickSection = async (position?: number) => {
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
    const handlenewEventPageSectionProduct = async (position?: number) => {
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

    const handleToggleSummerCollection = async () => {
        setIsLoading(true);
        try {
            const result = await toggleSummerCollection(
                product.id,
                product.isSummerCollection ?? false
            );
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update Summer Collection status");
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
                        <SectionPositionToggle label="Best Sellers" icon={Icons.Star} isActive={product.isBestSeller ?? false} isLoading={isLoading} sectionKey="bestSeller" onToggle={handleToggleBestSeller} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="Under 999 section" icon={Icons.DollarSign} isActive={product.isUnder999 ?? false} isLoading={isLoading} sectionKey="under999" onToggle={handleToggleUnder999} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="Featured Women" icon={Icons.Star} isActive={product.isFeaturedWomen ?? false} isLoading={isLoading} sectionKey="featuredWomen" onToggle={handleToggleFeatured} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="Hero Home Page" icon={Icons.Star} isActive={product.isHomeHeroProducts ?? false} isLoading={isLoading} sectionKey="homeHero" onToggle={handleToggleProductHeroHomePage} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="You may love these products Home Page" icon={Icons.Star} isActive={product.isHomeLoveTheseProducts ?? false} isLoading={isLoading} sectionKey="homeLoveThese" onToggle={handleToggleYouMayLoveThese} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="You may also like these products Home Page" icon={Icons.Star} isActive={product.isHomeYouMayAlsoLikeTheseProducts ?? false} isLoading={isLoading} sectionKey="homeMayAlsoLike" onToggle={handleToggleYouMayAlsoLikeThese} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="bottom products Home Page" icon={Icons.Star} isActive={product.isHomePageProduct ?? false} isLoading={isLoading} sectionKey="homePageList" onToggle={handleToggleHomePageMainProduct} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="Featured Men" icon={Icons.Star} isActive={product.isFeaturedMen ?? false} isLoading={isLoading} sectionKey="featuredMen" onToggle={handleToggleFeaturedMen} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="Style With Substance (Women)" icon={Icons.Layers} isActive={product.isStyleWithSubstanceWoMen ?? false} isLoading={isLoading} sectionKey="styleWithSubstanceWomen" onToggle={handleToggleWomenStyleWithSubstance} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="Style With Substance (Men)" icon={Icons.Layers} isActive={product.isStyleWithSubstanceMen ?? false} isLoading={isLoading} sectionKey="styleWithSubstanceMen" onToggle={handleToggleMenStyleWithSubstance} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="Product Feature (Kids)" icon={Icons.Layers} isActive={product.iskidsFetchSection ?? false} isLoading={isLoading} sectionKey="kidsFetch" onToggle={handleToggleKidsFetchProducts} onUpdatePosition={handleUpdatePosition} />
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
                        <SectionPositionToggle label="Top Picks(Home living)" icon={Icons.Layers} isActive={product.isHomeAndLivingSectionTopPicks ?? false} isLoading={isLoading} sectionKey="homeLivingTopPicks" onToggle={handletoggleHomeAndLivingTopPicksSection} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="New Arrivals(Beauty Personal)" icon={Icons.Layers} isActive={product.isBeautyNewArrival ?? false} isLoading={isLoading} sectionKey="beautyNewArrivals" onToggle={handletoggleBeautyNewArrivalSection} onUpdatePosition={handleUpdatePosition} />
                        <SectionPositionToggle label="Top Picks(Beauty Personal)" icon={Icons.Layers} isActive={product.isBeautyTopPicks ?? false} isLoading={isLoading} sectionKey="beautyTopPicks" onToggle={handletoggleBeautyTopPickSection} onUpdatePosition={handleUpdatePosition} />
                        <DropdownMenuItem
                            onClick={handleToggleSummerCollection}
                            disabled={isLoading}
                        >
                            <Icons.Sun className="size-4" />
                            <span>
                                {product.isSummerCollection
                                    ? "Remove from Summer Collection"
                                    : "Add to Summer Collection"}
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
                                    <div className="flex flex-col gap-3 p-2 pb-0">
                                        <Label className="text-xs font-semibold text-muted-foreground">Sequence Position</Label>
                                        <Input type="number" min={1} value={newArrivalsPos} onChange={e => setNewArrivalsPos(Number(e.target.value))} className="h-8" />
                                    </div>
                                    <DropdownMenuLabel>
                                        Select a Category
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {/* 🟢 Add to Category */}
                                    {NEW_ARRIVALS_CATEGORIES.map((category) => (
                                        <DropdownMenuItem
                                            key={category}
                                            onClick={
                                                () =>
                                                    handletoggleHomeNewArrivalsProduct(
                                                        category,
                                                        true
                                                    ) // ✅ add (isActive = true)
                                            }
                                            disabled={isLoading}
                                        >
                                            {product.homeNewArrivalCategory ===
                                                category && (
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
                                                        product.homeNewArrivalCategory ??
                                                            "",
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

                        <SectionPositionToggle label="Event Exibition Page" icon={Icons.Layers} isActive={product.isAddedInEventProductPage ?? false} isLoading={isLoading} sectionKey="eventPage" onToggle={handlenewEventPageSectionProduct} onUpdatePosition={handleUpdatePosition} />

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
