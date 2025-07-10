"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function NewCollection({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn(className, "bg-[#F4F0EC] py-4 md:py-12")} {...props}>
            <div className="mx-auto space-y-4 md:space-y-6 px-0 md:container">
                {banners.map((item, index) => (
                    <div
                        key={index}
                        className="relative w-full h-auto min-h-[200px] md:h-[400px] bg-[#F4F0EC] rounded-none md:rounded-lg overflow-hidden"
                    >
                        {/* Mobile - full image without cropping */}
                        <div className="md:hidden block w-full">
                            <Image
                                src={item.imageUrl}
                                alt={item.title}
                                width={800} // Set appropriate width
                                height={600} // Set appropriate height
                                className="w-full h-auto object-contain"
                                priority={index === 0}
                                quality={90}
                                sizes="100vw"
                            />
                        </div>
                        {/* Desktop - original cropped version */}
                        <div className="hidden md:block w-full h-full">
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