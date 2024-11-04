"use client";

import { useToolbar } from "@/components/toolbars/toolbar-provider";
import { Button, type ButtonProps } from "@/components/ui/button-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ListOrdered } from "lucide-react";
import React from "react";

const OrderedListToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, onClick, children, ...props }, ref) => {
        const { editor } = useToolbar();
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className={cn(
                            "size-8",
                            editor?.isActive("orderedList") &&
                                "bg-accent text-accent-foreground",
                            className
                        )}
                        onClick={(e) => {
                            editor?.chain().focus().toggleOrderedList().run();
                            onClick?.(e);
                        }}
                        disabled={
                            !editor
                                ?.can()
                                .chain()
                                .focus()
                                .toggleOrderedList()
                                .run()
                        }
                        ref={ref}
                        {...props}
                    >
                        {children || <ListOrdered className="size-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Ordered list</span>
                </TooltipContent>
            </Tooltip>
        );
    }
);

OrderedListToolbar.displayName = "OrderedListToolbar";

export { OrderedListToolbar };
