"use client";

import { useIntroModalStore } from "@/lib/store";
import { Button } from "../ui/button-general";

export function SoonButtons() {
    const setIsOpen = useIntroModalStore((state) => state.setIsOpen);

    return (
        <div className="flex flex-col items-center gap-2 md:flex-row">
            <Button
                variant="accent"
                className="w-full rounded-md font-semibold"
                onClick={() => {
                    setIsOpen(true);
                }}
            >
                Join Waitlist
            </Button>

            <Button
                className="w-full rounded-md font-semibold"
                onClick={() => {
                    setIsOpen(true);
                }}
            >
                Join as a Brand
            </Button>
        </div>
    );
}
