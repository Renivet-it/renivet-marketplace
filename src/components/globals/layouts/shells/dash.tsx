import { cn } from "@/lib/utils";

export function DashShell({ className, children, ...props }: GenericProps) {
    return (
        <div
            className={cn("flex flex-1 flex-col gap-4 p-4 pt-0", className)}
            {...props}
        >
            {children}
        </div>
    );
}
