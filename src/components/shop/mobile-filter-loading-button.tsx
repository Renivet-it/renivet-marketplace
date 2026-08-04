"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function MobileFilterLoadingButton({
    className,
}: {
    className?: string;
}) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("flex items-center gap-2", className)}
                >
                    <Icons.SlidersHorizontal
                        aria-hidden="true"
                        className="size-4"
                    />
                    Filters
                </Button>
            </SheetTrigger>
            <SheetContent
                side="bottom"
                className="z-[1001] flex h-[45dvh] flex-col p-0"
            >
                <SheetHeader className="border-b border-[#e3e8ef] bg-[#f8fafd] p-4">
                    <SheetTitle className="text-start text-base font-semibold text-[#20304a]">
                        Filters
                    </SheetTitle>
                </SheetHeader>
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[#5f6f83]">
                    <Spinner className="size-5 animate-spin" />
                    <p className="text-sm">Preparing your filters…</p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
