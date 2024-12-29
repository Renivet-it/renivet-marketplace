import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="flex w-full flex-col items-center gap-2 md:flex-row">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="h-10 w-full rounded-md md:w-44"
                        />
                    ))}
                </div>

                <Skeleton className="hidden h-9 w-24 rounded-md md:inline-block" />
            </div>

            <Skeleton className="h-96 w-full rounded-md" />

            <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-36 rounded-md" />

                <div className="flex items-center gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className={cn("size-8 rounded-md", {
                                "w-20": i === 0 || i === 3,
                                "hidden md:inline-block": i === 1 || i === 2,
                            })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
