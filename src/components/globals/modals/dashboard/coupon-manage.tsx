"use client";

import { TableCoupon } from "@/components/dashboard/coupons";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import {
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
} from "@/lib/validations";
import { Dispatch, SetStateAction } from "react";
import { CouponManageForm } from "../../forms";

interface PageProps {
    coupon?: TableCoupon;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    categories: CachedCategory[];
    subcategories: CachedSubCategory[];
    productTypes: CachedProductType[];
}

export function CouponManageModal({
    coupon,
    isOpen,
    setIsOpen,
    categories,
    subcategories,
    productTypes,
}: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{coupon ? "Edit" : "Add"} Coupon</DialogTitle>
                    <DialogDescription>
                        {coupon
                            ? "Fill out the form below to edit the coupon"
                            : "Fill out the form below to create a new coupon"}
                    </DialogDescription>
                </DialogHeader>

                <CouponManageForm
                    setIsOpen={setIsOpen}
                    coupon={coupon}
                    categories={categories}
                    subcategories={subcategories}
                    productTypes={productTypes}
                />
            </DialogContent>
        </Dialog>
    );
}
