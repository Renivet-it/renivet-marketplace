"use client";

import { useToolbar } from "@/components/toolbars/toolbar-provider";
import { Button, type ButtonProps } from "@/components/ui/button-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { UnderlineIcon } from "lucide-react";
import React from "react";

const UnderlineToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
                            editor?.isActive("underline") &&
                                "bg-accent text-accent-foreground",
                            className
                        )}
                        onClick={(e) => {
                            editor?.chain().focus().toggleUnderline().run();
                            onClick?.(e);
                        }}
                        disabled={
                            !editor
                                ?.can()
                                .chain()
                                .focus()
                                .toggleUnderline()
                                .run()
                        }
                        ref={ref}
                        {...props}
                    >
                        {children || <UnderlineIcon className="size-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Underline</span>
                    <span className="text-gray-11 ml-1 text-xs">(cmd + u)</span>
                </TooltipContent>
            </Tooltip>
        );
    }
);

UnderlineToolbar.displayName = "UnderlineToolbar";

export { UnderlineToolbar };
