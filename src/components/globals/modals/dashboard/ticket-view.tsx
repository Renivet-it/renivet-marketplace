"use client";

import { TableTicket } from "@/components/dashboard/tickets";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    ticket: TableTicket;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function TicketViewModal({ ticket, isOpen, setIsOpen }: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{ticket.name}&apos;s Ticket</DialogTitle>
                </DialogHeader>

                <p
                    dangerouslySetInnerHTML={{
                        __html: ticket.message.replace(
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
