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
interface PageProps {
    product: ReviewTableProduct & { visibility: boolean; stock: number };
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
                                return toast.success("ID copied to clipboard");
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
                                // href={`/dashboard/brands/${product.brandId}/products/p/${product.id}`}
                                href={`/dashboard/general/products/preview-form/${product.id}`}
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

                        {/* <DropdownMenuItem asChild>
                            <Link
                                href={`/dashboard/brands/${product.brandId}/products/p/${product.id}/values`}
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
                                href={`/dashboard/brands/${product.brandId}/products/p/${product.id}/journey`}
                            >
                                <Icons.Globe className="size-4" />
                                <span>
                                    {product.journey
                                        ? "Edit Journey"
                                        : "Add Journey"}
                                </span>
                            </Link>
                        </DropdownMenuItem> */}

                        {product.isPublished && (
                            <>
                                {/* <DropdownMenuItem
                                    onClick={() =>
                                        setIsAvailablityModalOpen(true)
                                    }
                                >
                                    {product.isAvailable ? (
                                        <Icons.X className="size-4" />
                                    ) : (
                                        <Icons.Check className="size-4" />
                                    )}
                                    <span>
                                        {product.isAvailable
                                            ? "Mark as Unavailable"
                                            : "Mark as Available"}
                                    </span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() =>
                                        setIsActivationModalOpen(true)
                                    }
                                >
                                    {product.isActive ? (
                                        <Icons.ChevronDown className="size-4" />
                                    ) : (
                                        <Icons.ChevronUp className="size-4" />
                                    )}
                                    <span>
                                        {product.isActive
                                            ? "Deactivate"
                                            : "Activate"}
                                    </span>
                                </DropdownMenuItem> */}
                            </>
                        )}

                        {product.verificationStatus === "idle" && (
                            <>
                                <DropdownMenuItem
                                    onClick={() =>
                                        setIsSendForReviewModalOpen(true)
                                    }
                                >
                                    <Icons.Shield className="size-4" />
                                    <span>Send for Review</span>
                                </DropdownMenuItem>
                            </>
                        )}

                        {product.verificationStatus === "rejected" && (
                            <>
                                <DropdownMenuItem
                                    onClick={() =>
                                        setIsSendForReviewModalOpen(true)
                                    }
                                >
                                    <Icons.Shield className="size-4" />
                                    <span>Resend for Review</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() =>
                                        setIsRejectionViewModalOpen(true)
                                    }
                                >
                                    <Icons.AlertTriangle className="size-4" />
                                    <span>View Reason</span>
                                </DropdownMenuItem>
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
