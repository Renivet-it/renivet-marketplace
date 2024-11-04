"use client";

import { useToolbar } from "@/components/toolbars/toolbar-provider";
import { Button, type ButtonProps } from "@/components/ui/button-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Extension } from "@tiptap/core";
import type { StarterKitOptions } from "@tiptap/starter-kit";
import { BoldIcon } from "lucide-react";
import React from "react";

// eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-explicit-any
type StarterKitExtensions = Extension<StarterKitOptions, any>;

const BoldToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, onClick, children, ...props }, ref) => {
        const { editor } = useToolbar();
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        type="button"
                        size="icon"
                        className={cn(
                            "size-8",
                            editor?.isActive("bold") &&
                                "bg-accent text-accent-foreground",
                            className
                        )}
                        onClick={(e) => {
                            editor?.chain().focus().toggleBold().run();
                            onClick?.(e);
                        }}
                        disabled={
                            !editor?.can().chain().focus().toggleBold().run()
                        }
                        ref={ref}
                        {...props}
                    >
                        {children || <BoldIcon className="size-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Bold</span>
                    <span className="text-gray-11 ml-1 text-xs">(cmd + b)</span>
                </TooltipContent>
            </Tooltip>
        );
    }
);

BoldToolbar.displayName = "BoldToolbar";

export { BoldToolbar };
