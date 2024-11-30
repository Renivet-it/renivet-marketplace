"use client";

import { CategoryManageModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { useState } from "react";

export function CategoriesPage() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
            >
                <Icons.PlusCircle className="size-5" />
                Create New Category
            </Button>
            <CategoryManageModal isOpen={isOpen} setIsOpen={setIsOpen} />
        </>
    );
}
