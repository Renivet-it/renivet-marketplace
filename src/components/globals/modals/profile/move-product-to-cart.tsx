"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import { CachedWishlist } from "@/lib/validations";
import { Dispatch, SetStateAction } from "react";
import { ProductCartMoveForm } from "../../forms";

interface PageProps {
    item: CachedWishlist;
    userId: string;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function MoveProductToCartModal({
    item,
    userId,
    isOpen,
    setIsOpen,
}: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Move to Cart</DialogTitle>
                </DialogHeader>

                <ProductCartMoveForm item={item} userId={userId} />
            </DialogContent>
        </Dialog>
    );
}
