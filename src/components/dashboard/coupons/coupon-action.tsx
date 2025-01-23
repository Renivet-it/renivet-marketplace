"use client";

import {
    CouponDeleteModal,
    CouponManageModal,
    CouponStatusModal,
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
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { TableCoupon } from "./coupons-table";

interface PageProps {
    coupon: TableCoupon;
}

export function CouponAction({ coupon }: PageProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [
        { data: categories, isPending: isCategoriesPending },
        { data: subCategories, isPending: isSubCategoriesPending },
        { data: productTypes, isPending: isProductTypesPending },
    ] = trpc.useQueries((t) => [
        t.general.categories.getCategories(),
        t.general.subCategories.getSubCategories(),
        t.general.productTypes.getProductTypes(),
    ]);

    const isPending =
        isCategoriesPending || isSubCategoriesPending || isProductTypesPending;

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
                        <DropdownMenuItem
                            disabled={isPending}
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            <Icons.Edit className="size-4" />
                            <span>Edit</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => setIsStatusModalOpen(true)}
                        >
                            {coupon.isActive ? (
                                <Icons.LockKeyhole className="size-4" />
                            ) : (
                                <Icons.LockKeyholeOpen className="size-4" />
                            )}
                            <span>
                                {coupon.isActive ? "Deactivate" : "Activate"}
                            </span>
                        </DropdownMenuItem>
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

            {!isPending && categories && subCategories && productTypes && (
                <CouponManageModal
                    isOpen={isEditModalOpen}
                    setIsOpen={setIsEditModalOpen}
                    coupon={coupon}
                    categories={categories.data}
                    subcategories={subCategories.data}
                    productTypes={productTypes.data}
                />
            )}

            <CouponStatusModal
                coupon={coupon}
                isOpen={isStatusModalOpen}
                setIsOpen={setIsStatusModalOpen}
            />

            <CouponDeleteModal
                coupon={coupon}
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
            />
        </>
    );
}
