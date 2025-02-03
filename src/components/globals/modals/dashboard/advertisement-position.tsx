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
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { cn, handleClientError, reorder } from "@/lib/utils";
import { Advertisement } from "@/lib/validations";
import {
    DragDropContext,
    Draggable,
    Droppable,
    DropResult,
} from "@hello-pangea/dnd";
import { useMutation } from "@tanstack/react-query";
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";

interface PageProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function AdvertisementPositionModal({ isOpen, setIsOpen }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", { defaultValue: "" });
    const [isPublished] = useQueryState(
        "isPublished",
        parseAsBoolean.withDefault(true)
    );

    const { refetch } =
        trpc.general.content.advertisements.getAdvertisements.useQuery({
            page,
            limit,
            search,
            isPublished,
        });

    const { data: advertisementsRaw } =
        trpc.general.content.advertisements.getAdvertisements.useQuery({
            page,
            limit,
            search,
            isPublished: true,
        });

    const [advertisements, setAdvertisements] = useState<Advertisement[]>(
        advertisementsRaw?.data ?? []
    );

    const handleDragStart = () => {
        if (window.navigator.vibrate) window.navigator.vibrate(100);
    };

    const { mutateAsync: updatePositions } =
        trpc.general.content.advertisements.updatePositions.useMutation();

    const { mutate: handleReorder, isPending: isReordering } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Reordering advertisements...");
            return { toastId };
        },
        mutationFn: async (result: DropResult) => {
            if (result.combine) {
                const newAdvertisements = [...advertisements];
                newAdvertisements.splice(result.source.index, 1);
                setAdvertisements(newAdvertisements);
                return;
            }

            if (!result.destination) return;
            if (result.destination.index === result.source.index) return;

            const newAdvertisements = reorder(
                advertisements,
                result.source.index,
                result.destination.index
            ).map((ad, index) => ({ ...ad, position: index + 1 }));

            setAdvertisements(newAdvertisements);

            await updatePositions(
                newAdvertisements.map((ad) => ({
                    id: ad.id,
                    position: ad.position,
                }))
            );
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Advertisements reordered", { id: toastId });
            setIsOpen(false);
            refetch();
        },
        onError: (err, _, ctx) => {
            setAdvertisements(advertisementsRaw?.data ?? []);
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Change Advertisement Position</DialogTitle>
                    <DialogDescription>
                        Drag and drop advertisements to reorder their positions.
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
                                {advertisements.map((ad, index) => (
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
                                                        <p className="line-clamp-1 text-sm">
                                                            {ad.title}
                                                        </p>
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
