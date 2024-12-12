"use client";

import { Icons } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button-general";
import { DEFAULT_MESSAGES } from "@/config/const";
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
    hideText?: boolean;
}

export function WishlistButton({
    isProductWishlisted,
    setIsProductWishlisted,
    productId,
    userId,
    iconClassName,
    hideText,
    ...props
}: WishlistButtonProps) {
    const router = useRouter();

    const { data: user, isPending: isUserFetching } =
        trpc.general.users.currentUser.useQuery();

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
                if (isUserFetching)
                    return toast.error(DEFAULT_MESSAGES.ERRORS.USER_FETCHING);
                if (!userId || !user) return router.push("/auth/signin");
                if (user.roles.length > 0)
                    return toast.error(
                        DEFAULT_MESSAGES.ERRORS.USER_NOT_CUSTOMER
                    );

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
            <span className={cn(hideText && "sr-only")}>
                {isProductWishlisted ? "Wishlisted" : "Wishlist"}
            </span>
        </Button>
    );
}
