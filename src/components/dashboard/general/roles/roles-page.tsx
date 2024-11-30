"use client";

import { RoleDraggableCard } from "@/components/globals/cards";
import { trpc } from "@/lib/trpc/client";
import { handleClientError, reorder } from "@/lib/utils";
import { CachedRole } from "@/lib/validations";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface PageProps {
    initialData: CachedRole[];
}

export function RolesPage({ initialData }: PageProps) {
    const router = useRouter();

    const { data: rolesRaw, refetch } = trpc.general.roles.getRoles.useQuery(
        undefined,
        { initialData }
    );

    const [roles, setRoles] = useState<CachedRole[]>(rolesRaw);

    const handleDragStart = () => {
        if (window.navigator.vibrate) window.navigator.vibrate(100);
    };

    const { mutateAsync: reorderRolesAsync } =
        trpc.general.roles.reorderRoles.useMutation();

    const { mutate: handleReorder, isPending: isReordering } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Reordering roles...");
            return { toastId };
        },
        mutationFn: async (result: DropResult) => {
            if (result.combine) {
                const newRoles: CachedRole[] = [...roles];
                newRoles.splice(result.source.index, 1);
                setRoles(newRoles);
                return;
            }

            if (!result.destination) return;
            if (result.destination.index === result.source.index) return;

            const newRoles = reorder(
                roles,
                result.source.index,
                result.destination.index
            ).map((role, index) => ({ ...role, position: index + 1 }));

            setRoles(newRoles);
            await reorderRolesAsync(newRoles);
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Roles reordered", { id: toastId });
            refetch();
            router.refresh();
        },
        onError: (err, _, ctx) => {
            setRoles(rolesRaw);
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
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
                        {roles.map((role, index) => (
                            <RoleDraggableCard
                                index={index}
                                key={role.id}
                                role={role}
                                roles={roles}
                                isDragDisabled={isReordering}
                            />
                        ))}
                        {provided.placeholder}
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
    );
}
