"use client";

import {
    ProductAvailablityModal,
    ProductDeleteModal,
    ProductPublishModal,
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
import { TableProduct } from "./products-table";

interface PageProps {
    product: TableProduct;
}

export function ProductAction({ product }: PageProps) {
    const [isSendForReviewModalOpen, setIsSendForReviewModalOpen] =
        useState(false);
    const [isAvailablityModalOpen, setIsAvailablityModalOpen] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        return toast.success("ID copied to clipboard");
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
                            onClick={() => handleCopyId(product.id)}
                        >
                            <Icons.Copy className="size-4" />
                            <span>Copy ID</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            disabled={product.isSentForReview}
                            asChild
                        >
                            <Link
                                href={`/dashboard/brands/${product.brandId}/products/p/${product.id}`}
                            >
                                <Icons.Edit className="size-4" />
                                <span>Edit</span>
                            </Link>
                        </DropdownMenuItem>

                        {product.isPublished && (
                            <DropdownMenuItem
                                disabled={
                                    product.isSentForReview ||
                                    !product.isPublished
                                }
                                onClick={() => setIsAvailablityModalOpen(true)}
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
                        )}

                        {product.status === "idle" && (
                            <DropdownMenuItem
                                onClick={() =>
                                    setIsSendForReviewModalOpen(true)
                                }
                            >
                                <Icons.Shield className="size-4" />
                                <span>Send for Review</span>
                            </DropdownMenuItem>
                        )}

                        {product.status === "rejected" && (
                            <DropdownMenuItem
                                onClick={() =>
                                    setIsSendForReviewModalOpen(true)
                                }
                            >
                                <Icons.Shield className="size-4" />
                                <span>Resend for Review</span>
                            </DropdownMenuItem>
                        )}

                        {!product.isPublished &&
                            product.status === "approved" && (
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

            <ProductPublishModal
                product={product}
                isOpen={isPublishModalOpen}
                setIsOpen={setIsPublishModalOpen}
            />

            <ProductAvailablityModal
                product={product}
                isOpen={isAvailablityModalOpen}
                setIsOpen={setIsAvailablityModalOpen}
            />

            <ProductDeleteModal
                product={product}
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
            />

            <ProductSendReviewModal
                product={product}
                isOpen={isSendForReviewModalOpen}
                setIsOpen={setIsSendForReviewModalOpen}
                isResend={product.status === "rejected"}
            />
        </>
    );
}
