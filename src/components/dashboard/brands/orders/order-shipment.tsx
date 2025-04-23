"use client";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TableOrder } from "./orders-table";

interface PageProps {
    isSheetOpen: boolean;
    setIsSheetOpen: (value: boolean) => void;
    side?: "top" | "bottom" | "left" | "right";
    order: TableOrder;
}

export default function OrderShipment({
    isSheetOpen,
    setIsSheetOpen,
    side = "right",
    order,
}: PageProps) {
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchCouriers = async () => {
            try {
                setLoading(true);
                console.log("Fetching from API route...");
                const res = await fetch("/api/shiprocket/couriers");
                const data = await res.json();

                if (data.status) {
                    console.log(data.data);
                } else {
                    toast.error(data.message);
                }
            } catch (err) {
                toast.error("Something went wrong");
            } finally {
                setLoading(false);
            }
        };
        if (isSheetOpen) fetchCouriers();
    }, [isSheetOpen]);
    return (
        <>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side={side}>
                    <SheetHeader className="mb-4">
                        <SheetTitle className={cn("capitalize text-primary")}>
                            Ship Products with our active courier partners
                        </SheetTitle>
                        <SheetDescription
                            className={cn("text-sm uppercase text-secondary")}
                        >
                            Display the list of courier partners and their
                            details please select your preferred
                        </SheetDescription>
                    </SheetHeader>
                    {loading ? (
                        <div className="flex h-24 items-center justify-center text-muted-foreground">
                            <Loader2 className="mr-2 animate-spin" />
                            Loading courier partners...
                        </div>
                    ) : (
                        <></>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
