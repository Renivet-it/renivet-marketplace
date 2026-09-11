import { FestiveFloralDivider } from "@/components/shop/festive-floral-divider";
import { Skeleton } from "@/components/ui/skeleton";

export default function FestiveLoading() {
    return (
        <div
            aria-busy="true"
            aria-label="Loading festive collection"
            className="min-h-screen bg-[#F0EBE2] px-3 pb-24 pt-3 md:px-6 md:pb-8"
        >
            <div className="mx-auto max-w-6xl space-y-5">
                <Skeleton className="h-[190px] w-full rounded-[20px] md:h-[360px] md:rounded-[28px]" />

                <div className="space-y-3 md:hidden">
                    <div className="flex h-14 items-center gap-3 rounded-[22px] border border-[#e3d6c3] bg-[#fffdf8] px-5 shadow-[0_14px_34px_rgba(64,54,36,0.09)]">
                        <span className="size-5 rounded-full border-2 border-[#7e776b]" />
                        <span className="text-base text-[#8b8375]">
                            Search for products, brands...
                        </span>
                    </div>
                    <div className="flex gap-3 overflow-hidden py-1">
                        <Skeleton className="h-12 w-28 shrink-0 rounded-full" />
                        <Skeleton className="h-12 w-28 shrink-0 rounded-full" />
                        <Skeleton className="h-12 w-44 shrink-0 rounded-full" />
                        <Skeleton className="h-12 w-36 shrink-0 rounded-full" />
                    </div>
                    <FestiveFloralDivider />
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                    {Array.from({ length: 10 }, (_, index) => (
                        <div key={index} className="space-y-3">
                            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
