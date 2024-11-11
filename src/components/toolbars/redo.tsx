"use client";

import { useToolbar } from "@/components/toolbars/toolbar-provider";
import { Button, type ButtonProps } from "@/components/ui/button-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CornerUpRight } from "lucide-react";
import React from "react";

const RedoToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
                            editor?.chain().focus().redo().run();
                            onClick?.(e);
                        }}
                        disabled={!editor?.can().chain().focus().redo().run()}
                        ref={ref}
                        {...props}
                    >
                        {children || <CornerUpRight className="size-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Redo</span>
                </TooltipContent>
            </Tooltip>
        );
    }
);

RedoToolbar.displayName = "RedoToolbar";

export { RedoToolbar };
