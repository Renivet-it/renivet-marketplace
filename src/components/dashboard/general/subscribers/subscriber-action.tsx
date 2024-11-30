"use client";

import { SubscriberDeleteModal } from "@/components/globals/modals";
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
import { NewsletterSubscriber } from "@/lib/validations";
import { useState } from "react";
import { toast } from "sonner";

interface PageProps {
    subscriber: NewsletterSubscriber;
}

export function SubscriberAction({ subscriber }: PageProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        return toast.success("Email copied to clipboard");
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
                            onClick={() => handleCopyEmail(subscriber.email)}
                        >
                            <Icons.Copy className="size-4" />
                            <span>Copy Email</span>
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

            <SubscriberDeleteModal
                subscriber={subscriber}
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
            />
        </>
    );
}
