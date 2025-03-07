"use client";

import { PlanStatusModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import { TablePlan } from "./plans-table";

interface PageProps {
    plan: TablePlan;
}

export function PlanAction({ plan }: PageProps) {
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="size-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <Icons.MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(plan.id);
                                return toast.success("ID copied to clipboard");
                            }}
                        >
                            <Icons.Copy className="size-4" />
                            <span>Copy ID</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() => setIsStatusModalOpen(true)}
                        >
                            {plan.isActive ? (
                                <Icons.LockKeyhole className="size-4" />
                            ) : (
                                <Icons.LockKeyholeOpen className="size-4" />
                            )}
                            <span>
                                {plan.isActive ? "Deactivate" : "Activate"}
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <PlanStatusModal
                plan={plan}
                isOpen={isStatusModalOpen}
                setIsOpen={setIsStatusModalOpen}
            />
        </>
    );
}
