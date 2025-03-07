"use client";

import { useToolbar } from "@/components/toolbars/toolbar-provider";
import { Button, type ButtonProps } from "@/components/ui/button-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SeparatorHorizontal } from "lucide-react";
import React from "react";

const HorizontalRuleToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
                            editor?.chain().focus().setHorizontalRule().run();
                            onClick?.(e);
                        }}
                        ref={ref}
                        {...props}
                    >
                        {children || <SeparatorHorizontal className="size-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Horizontal Rule</span>
                </TooltipContent>
            </Tooltip>
        );
    }
);

HorizontalRuleToolbar.displayName = "HorizontalRuleToolbar";

export { HorizontalRuleToolbar };
