"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CachedRole } from "@/lib/validations";
import { Draggable } from "@hello-pangea/dnd";
import Link from "next/link";
import { useState } from "react";
import { RoleDeleteModal } from "../modals";

interface PageProps {
    role: CachedRole;
    index: number;
    roles: CachedRole[];
    isDragDisabled: boolean;
}

export function RoleDraggableCard({
    role,
    index,
    roles,
    isDragDisabled,
}: PageProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    return (
        <>
            <Draggable
                key={role.id}
                draggableId={role.id}
                index={index}
                isDragDisabled={isDragDisabled || role.slug === "admin"}
            >
                {(provided) => (
                    // @ts-expect-error
                    <li
                        className={cn(
                            "flex items-center justify-between gap-4 rounded-lg bg-muted p-3 md:p-4",
                            isDragDisabled && "cursor-not-allowed opacity-60"
                        )}
                        aria-label={role.name}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                    >
                        <div className="flex items-center gap-2 md:gap-4">
                            <Icons.GripVertical className="size-4" />

                            <div className="flex items-center gap-2 md:gap-4">
                                <p className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground md:size-6 md:text-sm">
                                    {role.position}
                                </p>
                                <p className="text-sm md:text-base">
                                    {role.name}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <Button
                                variant="outline"
                                size="icon"
                                asChild
                                className="size-8 rounded rounded-r-none border-r-0 md:size-10"
                                disabled={
                                    isDragDisabled || role.slug === "admin"
                                }
                                title="Edit Role"
                            >
                                <Link
                                    href={`/dashboard/general/roles/r/${role.id}`}
                                    prefetch
                                    className={cn(
                                        role.slug === "admin" &&
                                            "cursor-default opacity-50 hover:bg-background hover:text-foreground"
                                    )}
                                    onClick={(e) => {
                                        if (role.slug === "admin")
                                            e.preventDefault();
                                    }}
                                >
                                    <Icons.Edit className="size-4" />
                                    <span className="sr-only">Edit</span>
                                </Link>
                            </Button>

                            <Button
                                size="icon"
                                variant="outline"
                                className="size-8 rounded rounded-l-none md:size-10"
                                onClick={() => setIsDeleteModalOpen(true)}
                                disabled={
                                    isDragDisabled ||
                                    roles.length === 1 ||
                                    role.slug === "admin"
                                }
                                title="Delete Role"
                            >
                                <Icons.X className="size-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </div>
                    </li>
                )}
            </Draggable>

            {role.slug === "admin" && <Separator />}

            <RoleDeleteModal
                role={role}
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
            />
        </>
    );
}
