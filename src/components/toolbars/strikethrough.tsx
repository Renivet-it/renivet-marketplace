"use client";

import { useToolbar } from "@/components/toolbars/toolbar-provider";
import { Button, type ButtonProps } from "@/components/ui/button-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Strikethrough } from "lucide-react";
import React from "react";

const StrikeThroughToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
                            editor?.isActive("strike") &&
                                "bg-accent text-accent-foreground",
                            className
                        )}
                        onClick={(e) => {
                            editor?.chain().focus().toggleStrike().run();
                            onClick?.(e);
                        }}
                        disabled={
                            !editor?.can().chain().focus().toggleStrike().run()
                        }
                        ref={ref}
                        {...props}
                    >
                        {children || <Strikethrough className="size-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Strikethrough</span>
                    <span className="text-gray-11 ml-1 text-xs">
                        (cmd + shift + x)
                    </span>
                </TooltipContent>
            </Tooltip>
        );
    }
);

StrikeThroughToolbar.displayName = "StrikeThroughToolbar";

export { StrikeThroughToolbar };
