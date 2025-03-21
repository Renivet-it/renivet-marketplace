import { cn } from "@/lib/utils";
import * as React from "react";
import TextareaAutoResize, {
    TextareaAutosizeProps,
} from "react-textarea-autosize";

export type TextareaProps = TextareaAutosizeProps;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <TextareaAutoResize
                className={cn(
                    "flex w-full resize-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Textarea.displayName = "Textarea";

export { Textarea };
