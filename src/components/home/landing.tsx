"use client";

import Image from "next/image";

export function Landing({ className, ...props }: GenericProps) {
    return (
        <section className="">
            <div className="relative h-full min-h-[40rem]">
                <div className="overflow-hidden">
                    <Image
                        src="/home/landing/landing_1.png"
                        alt="Landing 1"
                        height={2000}
                        width={2000}
                        className="size-full object-cover"
                    />
                </div>

                <div className="absolute left-1/4 top-0 flex h-full flex-col items-center gap-10 bg-red-500 p-10"></div>
            </div>
        </section>
    );
}
