"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { cn } from "@/lib/utils";
import { CachedRole } from "@/lib/validations";
import { Draggable } from "@hello-pangea/dnd";
import Link from "next/link";
import { useState } from "react";
import * as React from "react";
import { RoleDeleteModal } from "../modals";

interface PageProps {
    role: CachedRole;
    index: number;
    isDragDisabled: boolean;
}

export function RoleDraggableCard({ role, index, isDragDisabled }: PageProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    return (
        <>
            <Draggable
                key={role.id}
                draggableId={role.id}
                index={index}
                isDragDisabled={isDragDisabled}
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
                                disabled={isDragDisabled}
                                title="Edit Role"
                            >
                                <Link
                                    href={`/dashboard/general/roles/r/${role.id}`}
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
                                disabled={isDragDisabled}
                                title="Delete Role"
                            >
                                <Icons.X className="size-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </div>
                    </li>
                )}
            </Draggable>

            <RoleDeleteModal
                role={role}
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
            />
        </>
    );
}
