"use client";

import {
    BrandProductDeleteModal,
    BrandProductPositionModal,
} from "@/components/globals/modals";
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
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { TableBrandProduct } from "./brand-products-table";

interface PageProps {
    brandProduct: TableBrandProduct;
}

export function BrandProductAction({ brandProduct }: PageProps) {
    const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        return toast.success("ID copied to clipboard");
    };

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
                            onClick={() => handleCopyId(brandProduct.id)}
                        >
                            <Icons.Copy className="size-4" />
                            <span>Copy ID</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/dashboard/general/brand-products/b/${brandProduct.id}`}
                            >
                                <Icons.Edit className="size-4" />
                                <span>Edit</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => setIsPositionModalOpen(true)}
                        >
                            <Icons.ArrowUpDown className="size-4" />
                            <span>Change Position</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => setIsDeleteModalOpen(true)}
                    >
                        <Icons.Trash className="size-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <BrandProductPositionModal
                isOpen={isPositionModalOpen}
                setIsOpen={setIsPositionModalOpen}
            />

            <BrandProductDeleteModal
                brandProduct={brandProduct}
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
            />
        </>
    );
}
