"use client";

import { useToolbar } from "@/components/toolbars/toolbar-provider";
import { Button, type ButtonProps } from "@/components/ui/button-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { WrapText } from "lucide-react";
import React from "react";

const HardBreakToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, onClick, children, ...props }, ref) => {
        const { editor } = useToolbar();
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        type="button"
                        size="icon"
                        className={cn("size-8", className)}
                        onClick={(e) => {
                            editor?.chain().focus().setHardBreak().run();
                            onClick?.(e);
                        }}
                        ref={ref}
                        {...props}
                    >
                        {children || <WrapText className="size-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Hard break</span>
                </TooltipContent>
            </Tooltip>
        );
    }
);

HardBreakToolbar.displayName = "HardBreakToolbar";

export { HardBreakToolbar };
