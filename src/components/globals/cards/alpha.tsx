"use client";

import { useNavbarStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AlphaTestStrip() {
    const isNavbarOpen = useNavbarStore((state) => state.isOpen);

    return (
        <div
            className={cn(
                "w-full bg-destructive p-2 shadow-lg",
                isNavbarOpen ? "hidden" : "block"
            )}
        >
            <div className="flex items-center justify-center text-xs text-background md:text-sm">
                <p className="flex -skew-x-12 items-center gap-2">
                    Feature in{" "}
                    <strong>
                        <u>Alpha</u>
                    </strong>{" "}
                    Testing
                </p>
            </div>
        </div>
    );
}
