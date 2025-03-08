"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { cn, handleClientError, reorder } from "@/lib/utils";
import { HomeBrandProduct } from "@/lib/validations";
import {
    DragDropContext,
    Draggable,
    Droppable,
    DropResult,
} from "@hello-pangea/dnd";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";

interface PageProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function BrandProductPositionModal({ isOpen, setIsOpen }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const { refetch } =
        trpc.general.content.homeBrandProducts.getHomeBrandProducts.useQuery({
            page,
            limit,
        });

    const { data: brandProductsRaw } =
        trpc.general.content.homeBrandProducts.getHomeBrandProducts.useQuery({
            page,
            limit,
        });

    const [brandProducts, setBrandProducts] = useState<HomeBrandProduct[]>(
        brandProductsRaw?.data ?? []
    );

    const handleDragStart = () => {
        if (window.navigator.vibrate) window.navigator.vibrate(100);
    };

    const { mutateAsync: updatePositions } =
        trpc.general.content.homeBrandProducts.updatePositions.useMutation();

    const { mutate: handleReorder, isPending: isReordering } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Reordering brand products...");
            return { toastId };
        },
        mutationFn: async (result: DropResult) => {
            if (result.combine) {
                const newBrandProducts = [...brandProducts];
                newBrandProducts.splice(result.source.index, 1);
                setBrandProducts(newBrandProducts);
                return;
            }

            if (!result.destination) return;
            if (result.destination.index === result.source.index) return;

            const newBrandProducts = reorder(
                brandProducts,
                result.source.index,
                result.destination.index
            ).map((ad, index) => ({ ...ad, position: index + 1 }));

            setBrandProducts(newBrandProducts);

            await updatePositions(
                newBrandProducts.map((ad) => ({
                    id: ad.id,
                    position: ad.position,
                }))
            );
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Brand products reordered", { id: toastId });
            setIsOpen(false);
            refetch();
        },
        onError: (err, _, ctx) => {
            setBrandProducts(brandProductsRaw?.data ?? []);
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Change Brand Product Position</DialogTitle>
                    <DialogDescription>
                        Drag and drop brand products to reorder their positions.
                    </DialogDescription>
                </DialogHeader>

                <DragDropContext
                    onDragStart={handleDragStart}
                    onDragEnd={(res) => handleReorder(res)}
                >
                    <Droppable droppableId="droppable">
                        {(provided) => (
                            <ul
                                className="space-y-4"
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {brandProducts.map((ad, index) => (
                                    <Draggable
                                        key={ad.id}
                                        draggableId={ad.id}
                                        index={index}
                                        isDragDisabled={isReordering}
                                    >
                                        {(provided) => (
                                            // @ts-expect-error
                                            <li
                                                className={cn(
                                                    "flex items-center justify-between gap-4 rounded-lg bg-muted p-3",
                                                    isReordering &&
                                                        "cursor-not-allowed opacity-60"
                                                )}
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Icons.GripVertical className="size-4" />
                                                    <div className="flex items-center gap-4">
                                                        <p className="flex size-6 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                                                            {ad.position}
                                                        </p>
                                                        <Popover>
                                                            <PopoverTrigger
                                                                asChild
                                                            >
                                                                <button className="relative size-10 overflow-hidden rounded-md">
                                                                    <Image
                                                                        src={
                                                                            ad.imageUrl
                                                                        }
                                                                        alt={`Product ${ad.position}`}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                </button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80 overflow-hidden p-0">
                                                                <div className="relative aspect-square w-full overflow-hidden">
                                                                    <Image
                                                                        src={
                                                                            ad.imageUrl
                                                                        }
                                                                        alt={`Product ${ad.position}`}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                </div>
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>

                <Separator />

                <div className="flex justify-end gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isReordering}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
