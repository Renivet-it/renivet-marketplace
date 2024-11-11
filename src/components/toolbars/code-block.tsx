"use client";

import { useToolbar } from "@/components/toolbars/toolbar-provider";
import { Button, type ButtonProps } from "@/components/ui/button-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Code } from "lucide-react";
import React from "react";

const CodeBlockToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
                            editor?.isActive("codeBlock") &&
                                "bg-accent text-accent-foreground",
                            className
                        )}
                        onClick={(e) => {
                            editor?.chain().focus().toggleCodeBlock().run();
                            onClick?.(e);
                        }}
                        disabled={
                            !editor
                                ?.can()
                                .chain()
                                .focus()
                                .toggleCodeBlock()
                                .run()
                        }
                        ref={ref}
                        {...props}
                    >
                        {children || <Code className="size-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Code Block</span>
                </TooltipContent>
            </Tooltip>
        );
    }
);

CodeBlockToolbar.displayName = "CodeBlockToolbar";

export { CodeBlockToolbar };
