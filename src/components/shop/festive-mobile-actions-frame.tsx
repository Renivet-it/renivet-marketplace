import Image from "next/image";
import type { ReactNode } from "react";

interface FestiveMobileActionsFrameProps {
    filters: ReactNode;
    sort: ReactNode;
}

export function FestiveMobileActionsFrame({
    filters,
    sort,
}: FestiveMobileActionsFrameProps) {
    return (
        <div className="bg-[#F0EBE2]">
            <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-5 [&_button]:text-base">
                <div className="flex h-full min-w-0 items-center justify-center">
                    {filters}
                </div>
                <div
                    data-festive-lotus-medallion="true"
                    aria-hidden="true"
                    className="relative size-[48px] shrink-0"
                >
                    <div
                        className="absolute inset-0 bg-[#d7a92d]"
                        style={{
                            clipPath:
                                "polygon(50% 0%, 61% 8%, 75% 6%, 83% 18%, 96% 24%, 94% 39%, 100% 50%, 92% 61%, 94% 76%, 81% 82%, 75% 94%, 61% 92%, 50% 100%, 39% 92%, 25% 94%, 18% 82%, 6% 76%, 8% 61%, 0% 50%, 8% 39%, 6% 24%, 18% 18%, 25% 6%, 39% 8%)",
                        }}
                    />
                    <div
                        className="absolute inset-[2px] bg-[#ef2d68]"
                        style={{
                            clipPath:
                                "polygon(50% 0%, 61% 8%, 75% 6%, 83% 18%, 96% 24%, 94% 39%, 100% 50%, 92% 61%, 94% 76%, 81% 82%, 75% 94%, 61% 92%, 50% 100%, 39% 92%, 25% 94%, 18% 82%, 6% 76%, 8% 61%, 0% 50%, 8% 39%, 6% 24%, 18% 18%, 25% 6%, 39% 8%)",
                        }}
                    />
                    <div
                        className="absolute inset-[4px] bg-[#174f34]"
                        style={{
                            clipPath:
                                "polygon(50% 0%, 61% 8%, 75% 6%, 83% 18%, 96% 24%, 94% 39%, 100% 50%, 92% 61%, 94% 76%, 81% 82%, 75% 94%, 61% 92%, 50% 100%, 39% 92%, 25% 94%, 18% 82%, 6% 76%, 8% 61%, 0% 50%, 8% 39%, 6% 24%, 18% 18%, 25% 6%, 39% 8%)",
                        }}
                    />
                    <Image
                        src="/assets/festive-season/festive-mobile-actions-lotus.svg"
                        alt=""
                        width={24}
                        height={28}
                        className="absolute left-1/2 top-1/2 h-7 w-6 -translate-x-1/2 -translate-y-1/2 object-contain"
                    />
                </div>
                <div className="flex h-full min-w-0 items-center justify-center">
                    {sort}
                </div>
            </div>
            <div
                aria-hidden="true"
                className="h-[21px] w-full bg-repeat-x"
                style={{
                    backgroundImage:
                        "url('/assets/festive-season/festive-mobile-actions-border.svg')",
                    backgroundPosition: "bottom center",
                    backgroundSize: "auto 21px",
                }}
            />
            <div
                data-festive-bottom-spacing="true"
                aria-hidden="true"
                className="h-4"
            />
        </div>
    );
}
