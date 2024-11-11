"use client";

import { useToolbar } from "@/components/toolbars/toolbar-provider";
import { Button, type ButtonProps } from "@/components/ui/button-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ItalicIcon } from "lucide-react";
import React from "react";

const ItalicToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
                            editor?.isActive("italic") &&
                                "bg-accent text-accent-foreground",
                            className
                        )}
                        onClick={(e) => {
                            editor?.chain().focus().toggleItalic().run();
                            onClick?.(e);
                        }}
                        disabled={
                            !editor?.can().chain().focus().toggleItalic().run()
                        }
                        ref={ref}
                        {...props}
                    >
                        {children || <ItalicIcon className="size-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Italic</span>
                    <span className="text-gray-11 ml-1 text-xs">(cmd + i)</span>
                </TooltipContent>
            </Tooltip>
        );
    }
);

ItalicToolbar.displayName = "ItalicToolbar";

export { ItalicToolbar };
