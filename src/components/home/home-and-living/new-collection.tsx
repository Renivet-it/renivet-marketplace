"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function NewCollection({ className, banners, ...props }: PageProps) {
    return (
        <section
            className={cn(className, "bg-[#FCFBF4] py-4 md:py-12")}
            {...props}
        >
            <div className="mx-auto space-y-4 px-0 md:container md:space-y-6">
                {banners.map((item, index) => (
                    <div
                        key={index}
                        className="relative h-auto w-full overflow-hidden rounded-none bg-[#FCFBF4] md:h-[400px] md:rounded-lg"
                    >
                        {/* Mobile - full image without cropping */}
                        <div className="block w-full md:hidden">
                            <Image
                                src={item.imageUrl}
                                alt={item.title}
                                width={800} // Set appropriate width
                                height={600} // Set appropriate height
                                className="h-auto w-full object-contain"
                                priority={index === 0}
                                quality={90}
                                sizes="100vw"
                            />
                        </div>
                        {/* Desktop - original cropped version */}
                        <div className="hidden h-full w-full md:block">
                            <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                className="object-cover"
                                priority={index === 0}
                                quality={90}
                                sizes="100vw"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
