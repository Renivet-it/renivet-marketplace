"use client";

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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { TableProduct as ReviewTableProduct } from "./products-review-table";
import {
    toggleFeaturedProduct,
    menToggleFeaturedProduct,
    toggleWomenStyleWithSubstance,
    toggleMenStyleWithSubstance,
    toggleKidsFetchSection,
    toggleHomeAndLivingNewArrivalsSection,
    toggleHomeAndLivingTopPicksSection
} from "@/actions/product-action";
import { trpc } from "@/lib/trpc/client";
import { parseAsInteger, useQueryState } from "nuqs";

interface PageProps {
    product: ReviewTableProduct & {
        visibility: boolean;
        stock: number;
        isFeaturedWomen?: boolean;
        isFeaturedMen?: boolean;
        isStyleWithSubstanceWoMen?: boolean;
        isStyleWithSubstanceMen?: boolean;
        iskidsFetchSection?: boolean;
    };
}

export function ProductAction({ product }: PageProps) {
    const [isRejectionViewModalOpen, setIsRejectionViewModalOpen] = useState(false);
    const [isSendForReviewModalOpen, setIsSendForReviewModalOpen] = useState(false);
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

    const handleToggleFeatured = async () => {
        setIsLoading(true);
        try {
            const result = await toggleFeaturedProduct(product.id, product.isFeaturedWomen ?? false);
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
            const result = await menToggleFeaturedProduct(product.id, product.isFeaturedMen ?? false);
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
            const result = await toggleWomenStyleWithSubstance(product.id, product.isStyleWithSubstanceWoMen ?? false);
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
            const result = await toggleMenStyleWithSubstance(product.id, product.isStyleWithSubstanceMen ?? false);
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
            const result = await toggleKidsFetchSection(product.id, product.iskidsFetchSection ?? false);
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
            const result = await toggleHomeAndLivingNewArrivalsSection(product.id, product.iskidsFetchSection ?? false);
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
            const result = await toggleHomeAndLivingTopPicksSection(product.id, product.iskidsFetchSection ?? false);
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
                            <DropdownMenuItem asChild disabled={!product.isPublished}>
                                <Link href={`/products/${product.slug}`} target="_blank">
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
                        <DropdownMenuItem disabled={product.verificationStatus === "pending"} asChild>
                            <Link href={`/dashboard/general/products/preview-form/${product.id}`} target="_blank">
                                <Icons.Edit className="size-4" />
                                <span>Edit</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={product.verificationStatus === "pending"} asChild>
                            <Link href={`/dashboard/general/products/${product.id}`}>
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
                                <span>{product.values ? "Edit Values" : "Add Values"}</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                            <Link
                                href={`/dashboard/general/products/preview-form/${product.id}/journey`}
                                target="_blank"
                            >
                                <Icons.Globe className="size-4" />
                                <span>{product.journey ? "Edit Journey" : "Add Journey"}</span>
                            </Link>
                        </DropdownMenuItem>

                        {/* Featured Products Section */}
                        <DropdownMenuItem onClick={handleToggleFeatured} disabled={isLoading}>
                            <Icons.Star className="size-4" />
                            <span>{product.isFeaturedWomen ? "Remove from Featured Women" : "Add to Featured Women"}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handleToggleFeaturedMen} disabled={isLoading}>
                            <Icons.Star className="size-4" />
                            <span>{product.isFeaturedMen ? "Remove from Featured Men" : "Add to Featured Men"}</span>
                        </DropdownMenuItem>

                        {/* Style With Substance Section */}
                        <DropdownMenuItem onClick={handleToggleWomenStyleWithSubstance} disabled={isLoading}>
                            <Icons.Layers className="size-4" />
                            <span>{product.isStyleWithSubstanceWoMen ? "Remove from Style With Substance (Women)" : "Add to Style With Substance (Women)"}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handleToggleMenStyleWithSubstance} disabled={isLoading}>
                            <Icons.Layers className="size-4" />
                            <span>{product.isStyleWithSubstanceMen ? "Remove from Style With Substance (Men)" : "Add to Style With Substance (Men)"}</span>
                        </DropdownMenuItem>

                         <DropdownMenuItem onClick={handleToggleKidsFetchProducts} disabled={isLoading}>
                            <Icons.Layers className="size-4" />
                            <span>{product.iskidsFetchSection ? "Remove from Product Feature (Kids)" : "Add to Product Feature (Kids)"}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handletoggleHomeAndLivingNewArrivalsSection} disabled={isLoading}>
                            <Icons.Layers className="size-4" />
                            <span>{product.isStyleWithSubstanceMen ? "Remove from New Arrivals (Home living)" : "Add to New Arrivals (Home living)"}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handletoggleHomeAndLivingTopPicksSection} disabled={isLoading}>
                            <Icons.Layers className="size-4" />
                            <span>{product.isStyleWithSubstanceMen ? "Remove from Top Picks(Home living)" : "Add to Top Picks(Home living)"}</span>
                        </DropdownMenuItem>
                        {product.isPublished && (
                            <>
                                {/* Existing availability and activation items */}
                            </>
                        )}

                        {product.verificationStatus === "idle" && (
                            <DropdownMenuItem onClick={() => setIsSendForReviewModalOpen(true)}>
                                <Icons.Shield className="size-4" />
                                <span>Send for Review</span>
                            </DropdownMenuItem>
                        )}

                        {product.verificationStatus === "rejected" && (
                            <>
                                <DropdownMenuItem onClick={() => setIsSendForReviewModalOpen(true)}>
                                    <Icons.Shield className="size-4" />
                                    <span>Resend for Review</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsRejectionViewModalOpen(true)}>
                                    <Icons.AlertTriangle className="size-4" />
                                    <span>View Reason</span>
                                </DropdownMenuItem>
                            </>
                        )}

                        {!product.isPublished && product.verificationStatus === "approved" && (
                            <DropdownMenuItem onClick={() => setIsPublishModalOpen(true)}>
                                <Icons.Send className="size-4" />
                                <span>Publish Product</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)}>
                        <Icons.Trash className="size-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Existing modals */}
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