"use client";

import {
    BrandWaitlistForm,
    NewsLetterSubscribeForm,
} from "@/components/globals/forms";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { siteConfig } from "@/config/site";
import { useIntroModalStore } from "@/lib/store";
import ms from "enhanced-ms";
import { useEffect, useState } from "react";

export function IntroModal() {
    const [currentTab, setCurrentTab] = useState<"community" | "brand">(
        "community"
    );

    const isOpen = useIntroModalStore((state) => state.isOpen);
    const setIsOpen = useIntroModalStore((state) => state.setIsOpen);

    useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof localStorage === "undefined"
        )
            return;

        const itemName = `${siteConfig.name}-intro-expiry-13368`.toLowerCase();

        const expiry = localStorage.getItem(itemName);
        if (!expiry) {
            setTimeout(() => setIsOpen(true), 2000);
            localStorage.setItem(
                itemName,
                (new Date().getTime() + ms("1d")).toString()
            );
        }

        if (expiry && new Date().getTime() > parseInt(expiry)) {
            localStorage.removeItem(itemName);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen} defaultOpen={false}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Welcome to {siteConfig.name}!</DialogTitle>
                </DialogHeader>

                <div className="">
                    <Tabs
                        defaultValue="community"
                        onValueChange={(value) =>
                            setCurrentTab(value as "community" | "brand")
                        }
                        value={currentTab}
                    >
                        <TabsContent value="community">
                            <NewsLetterSubscribeForm
                                setCurrentTab={setCurrentTab}
                            />
                        </TabsContent>

                        <TabsContent value="brand">
                            <BrandWaitlistForm setCurrentTab={setCurrentTab} />
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
