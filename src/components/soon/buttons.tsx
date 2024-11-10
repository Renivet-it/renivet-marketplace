"use client";

import { useIntroModalStore } from "@/lib/store";
import { useState } from "react";
import { IntroModal } from "../globals/modals";
import { Button } from "../ui/button-general";

export function SoonButtons() {
    const [currentTab, setCurrentTab] = useState<"community" | "brand">();

    const setIsOpen = useIntroModalStore((state) => state.setIsOpen);

    return (
        <div className="flex flex-col items-center gap-2 md:flex-row">
            <Button
                variant="accent"
                className="w-full rounded-md font-semibold"
                onClick={() => {
                    setIsOpen(true);
                    setCurrentTab("community");
                }}
            >
                Join Waitlist
            </Button>

            <Button
                className="w-full rounded-md font-semibold"
                onClick={() => {
                    setIsOpen(true);
                    setCurrentTab("brand");
                }}
            >
                Join as a Brand
            </Button>

            <IntroModal selectedTab={currentTab} />
        </div>
    );
}
