"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { Icons } from "../icons";

const Notice = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "flex flex-col justify-between gap-4 border-2 border-red-500 bg-yellow-300/10 p-4 md:flex-row md:items-center",
            className
        )}
        {...props}
    />
));
Notice.displayName = "Notice";

const NoticeTitle = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "flex items-center gap-1 text-lg font-semibold",
            className
        )}
        {...props}
    />
));
NoticeTitle.displayName = "NoticeTitle";

const NoticeContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-1", className)} {...props} />
));
NoticeContent.displayName = "NoticeContent";

interface NoticeButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
}

const NoticeButton = React.forwardRef<HTMLButtonElement, NoticeButtonProps>(
    ({ asChild = false, className, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                ref={ref}
                className={cn("w-full md:w-auto", className)}
                {...props}
            />
        );
    }
);
NoticeButton.displayName = "NoticeButton";

const NoticeIcon = React.forwardRef<
    React.ElementRef<typeof Icons.AlertTriangle>,
    React.ComponentPropsWithoutRef<typeof Icons.AlertTriangle>
>(({ className, children, ...props }, ref) => (
    <>
        {!children ? (
            <Icons.AlertTriangle
                ref={ref}
                className={cn("size-4", className)}
                {...props}
            />
        ) : (
            <>{children}</>
        )}
    </>
));
NoticeIcon.displayName = "NoticeIcon";

export { Notice, NoticeTitle, NoticeContent, NoticeButton, NoticeIcon };
