"use client";

import { useIntroModalStore } from "@/lib/store";
import { useState } from "react";
import { IntroModal } from "../globals/modals";
import { Button } from "../ui/button";

export function SoonButtons() {
    const [currentTab, setCurrentTab] = useState<"community" | "brand">();

    const setIsOpen = useIntroModalStore((state) => state.setIsOpen);

    return (
        <div className="flex flex-col items-center gap-2 md:flex-row">
            <Button
                className="w-full rounded-md bg-background font-semibold text-foreground hover:bg-background/80"
                onClick={() => {
                    setIsOpen(true);
                    setCurrentTab("community");
                }}
            >
                Join Waitlist
            </Button>

            <Button
                className="w-full rounded-md bg-background font-semibold text-foreground hover:bg-background/80"
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
