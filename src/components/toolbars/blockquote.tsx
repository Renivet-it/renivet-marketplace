"use client";

import { useToolbar } from "@/components/toolbars/toolbar-provider";
import { Button, type ButtonProps } from "@/components/ui/button-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TextQuote } from "lucide-react";
import React from "react";

const BlockquoteToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
                            editor?.isActive("blockquote") &&
                                "bg-accent text-accent-foreground",
                            className
                        )}
                        onClick={(e) => {
                            editor?.chain().focus().toggleBlockquote().run();
                            onClick?.(e);
                        }}
                        disabled={
                            !editor
                                ?.can()
                                .chain()
                                .focus()
                                .toggleBlockquote()
                                .run()
                        }
                        ref={ref}
                        {...props}
                    >
                        {children || <TextQuote className="size-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Blockquote</span>
                </TooltipContent>
            </Tooltip>
        );
    }
);

BlockquoteToolbar.displayName = "BlockquoteToolbar";

export { BlockquoteToolbar };
