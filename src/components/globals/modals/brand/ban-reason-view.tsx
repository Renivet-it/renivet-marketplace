"use client";

import { TableBan } from "@/components/dashboard/brands/bans";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    ban: TableBan;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function BanReasonViewModal({ ban, isOpen, setIsOpen }: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{ban.name}&apos;s Ban Reason</DialogTitle>
                </DialogHeader>

                <p
                    dangerouslySetInnerHTML={{
                        __html:
                            ban.reason ??
                            "No reason provided".replace(
                                /(?:\r\n|\r|\n)/g,
                                "<br />"
                            ),
                    }}
                    className="text-sm"
                />
            </DialogContent>
        </Dialog>
    );
}
