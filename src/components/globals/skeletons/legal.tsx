import { Skeleton } from "@/components/ui/skeleton";

export function LegalSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-96 rounded-md" />
            <Skeleton className="h-10 rounded-md" />
        </div>
    );
}
