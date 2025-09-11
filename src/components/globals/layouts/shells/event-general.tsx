import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";

interface ShellProps extends LayoutProps {
    classNames?: {
        mainWrapper?: ClassValue;
        innerWrapper?: ClassValue;
    };
}

export function GeneralShellEvent({ children, classNames }: ShellProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center", // Visible on all screens
                classNames?.mainWrapper
            )}
        >
            <div
                className={cn(
                    // ✅ No extra styling on mobile, apply from md+
                    "w-full md:max-w-5xl md:space-y-4 md:p-8 md:py-10 xl:max-w-[100rem]",
                    classNames?.innerWrapper
                )}
            >
                {children}
            </div>
        </section>
    );
}
