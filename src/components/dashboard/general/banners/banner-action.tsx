"use client";

import {
    BannerDeleteModal,
    BannerStatusModal,
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
import { TableBanner } from "./banners-table";

interface PageProps {
    banner: TableBanner;
}

export function BannerAction({ banner }: PageProps) {
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
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
                            onClick={() => handleCopyId(banner.id)}
                        >
                            <Icons.Copy className="size-4" />
                            <span>Copy ID</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/dashboard/general/banners/b/${banner.id}`}
                            >
                                <Icons.Edit className="size-4" />
                                <span>Edit</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => setIsStatusModalOpen(true)}
                        >
                            {banner.isActive ? (
                                <Icons.LockKeyhole className="size-4" />
                            ) : (
                                <Icons.LockKeyholeOpen className="size-4" />
                            )}
                            <span>
                                {banner.isActive ? "Deactivate" : "Activate"}
                            </span>
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

            <BannerStatusModal
                banner={banner}
                isOpen={isStatusModalOpen}
                setIsOpen={setIsStatusModalOpen}
            />

            <BannerDeleteModal
                banner={banner}
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
            />
        </>
    );
}
