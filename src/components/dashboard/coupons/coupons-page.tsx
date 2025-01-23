"use client";

import { CouponManageModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
} from "@/lib/validations";
import { useState } from "react";

interface PageProps {
    categories: CachedCategory[];
    subcategories: CachedSubCategory[];
    productTypes: CachedProductType[];
}

export function CouponsPage({
    categories,
    subcategories,
    productTypes,
}: PageProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
            >
                <Icons.PlusCircle />
                Add a Coupon
            </Button>
            <CouponManageModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                categories={categories}
                subcategories={subcategories}
                productTypes={productTypes}
            />
        </>
    );
}
