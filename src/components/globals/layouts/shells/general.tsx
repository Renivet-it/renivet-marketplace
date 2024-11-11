import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";

interface ShellProps extends LayoutProps {
    classNames?: {
        mainWrapper?: ClassValue;
        innerWrapper?: ClassValue;
    };
}

export function GeneralShell({ children, classNames }: ShellProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center",
                classNames?.mainWrapper
            )}
        >
            <div
                className={cn(
                    "w-full max-w-5xl space-y-4 p-8 py-10 xl:max-w-[100rem]",
                    classNames?.innerWrapper
                )}
            >
                {children}
            </div>
        </section>
    );
}
