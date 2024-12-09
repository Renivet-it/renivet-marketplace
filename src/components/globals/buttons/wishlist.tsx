"use client";

import { Icons } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface WishlistButtonProps extends ButtonProps {
    isProductWishlisted: boolean;
    setIsProductWishlisted: Dispatch<SetStateAction<boolean>>;
    userId?: string;
    productId: string;
    iconClassName?: string;
}

export function WishlistButton({
    isProductWishlisted,
    setIsProductWishlisted,
    productId,
    userId,
    iconClassName,
    ...props
}: WishlistButtonProps) {
    const router = useRouter();

    const { refetch } = trpc.general.users.wishlist.getWishlist.useQuery(
        { userId: userId! },
        { enabled: !!userId }
    );

    const { mutate: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onMutate: () => {
                setIsProductWishlisted(!isProductWishlisted);
                toast.success(
                    isProductWishlisted
                        ? "Removed from wishlist"
                        : "Added to wishlist"
                );
            },
            onSuccess: () => {
                refetch();
            },
            onError: (err) => {
                toast.error(err.message);
                setIsProductWishlisted(!isProductWishlisted);
            },
        });

    const { mutate: removeFromWishlist } =
        trpc.general.users.wishlist.removeProductInWishlist.useMutation({
            onMutate: () => {
                setIsProductWishlisted(!isProductWishlisted);
                toast.success(
                    isProductWishlisted
                        ? "Removed from wishlist"
                        : "Added to wishlist"
                );
            },
            onSuccess: () => {
                refetch();
            },
            onError: (err) => {
                toast.error(err.message);
                setIsProductWishlisted(!isProductWishlisted);
            },
        });

    return (
        <Button
            size="sm"
            onClick={() => {
                if (!userId) return router.push("/auth/signin");

                if (isProductWishlisted)
                    removeFromWishlist({
                        userId,
                        productId,
                    });
                else
                    addToWishlist({
                        userId,
                        productId,
                    });
            }}
            {...props}
        >
            <Icons.Heart
                className={cn(
                    isProductWishlisted && "fill-primary stroke-primary",
                    iconClassName
                )}
            />
            {isProductWishlisted ? "Wishlisted" : "Wishlist"}
        </Button>
    );
}
