"use client";

import { SubCategoryManageModal } from "@/components/globals/modals/dashboard/sub-category-manage";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { useState } from "react";

export function SubCategoriesPage() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
            >
                <Icons.PlusCircle className="size-5" />
                Create New Sub Category
            </Button>
            <SubCategoryManageModal isOpen={isOpen} setIsOpen={setIsOpen} />
        </>
    );
}
