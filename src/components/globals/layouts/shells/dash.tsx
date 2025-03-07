import { cn } from "@/lib/utils";

export function DashShell({ className, children, ...props }: GenericProps) {
    return (
        <div className="flex flex-1 justify-center">
            <div
                className={cn(
                    "relative flex w-full max-w-5xl flex-1 flex-col gap-4 p-5 md:p-10 md:pt-5",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </div>
    );
}
