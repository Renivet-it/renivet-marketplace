"use client";

import {
    toggleBestSeller,
    updateSectionPosition,
} from "@/actions/product-action";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input-general";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface MostPopularBestSellerActionProps {
    productId: string;
    isBestSeller?: boolean | null;
    bestSellerPosition?: number | null;
}

export function MostPopularBestSellerAction({
    productId,
    isBestSeller,
    bestSellerPosition,
}: MostPopularBestSellerActionProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [position, setPosition] = useState(
        bestSellerPosition && bestSellerPosition > 0 ? bestSellerPosition : 1
    );

    const refreshPage = () => {
        startTransition(() => router.refresh());
    };

    const handleToggle = async () => {
        const result = await toggleBestSeller(
            productId,
            isBestSeller ? undefined : position
        );

        if (result.success) {
            toast.success(result.message);
            refreshPage();
            return;
        }

        toast.error(result.error);
    };

    const handlePositionUpdate = async () => {
        const result = await updateSectionPosition(
            productId,
            "bestSeller",
            position
        );

        if (result.success) {
            toast.success(result.message);
            refreshPage();
            return;
        }

        toast.error(result.error);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant={isBestSeller ? "secondary" : "outline"}
                    disabled={isPending}
                >
                    <Icons.Star className="size-4" />
                    {isBestSeller ? "Best Seller" : "Add Best Seller"}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                        Sequence Position
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={1}
                            value={position}
                            onChange={(event) =>
                                setPosition(Number(event.target.value))
                            }
                            className="h-8"
                        />
                        {isBestSeller ? (
                            <Button
                                size="sm"
                                disabled={isPending}
                                onClick={handlePositionUpdate}
                            >
                                Update
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                disabled={isPending}
                                onClick={handleToggle}
                            >
                                Add
                            </Button>
                        )}
                    </div>
                </div>

                {isBestSeller && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            disabled={isPending}
                            onClick={handleToggle}
                            className="cursor-pointer justify-center text-red-500 focus:text-red-500"
                        >
                            Remove from Best Sellers
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
