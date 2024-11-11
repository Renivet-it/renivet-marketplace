import { cn } from "@/lib/utils";

export function DashShell({ className, children, ...props }: GenericProps) {
    return (
        <div className="flex flex-1 justify-center">
            <div
                className={cn(
                    "relative flex w-full max-w-5xl flex-1 flex-col gap-4 p-10 pt-5",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </div>
    );
}
