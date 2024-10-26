"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

const offerData = {
    title: "Glamorous Karwa Chauth Outfit Ideas Inspired By Celebs",
    description:
        "When your OOTDs call for a bit of cuteness with a dash of chic, crop tops never fail to come through. These styling tips will help you incorporate crop tops…",
    buttonText: "Read More",
    img: "/images/blog2.jpeg",
};

export function Blogs({ className, ...props }: GenericProps) {
    return (
        <section
            className={cn(
                "flex justify-center px-4 py-5 md:px-8 md:py-10",
                className
            )}
            {...props}
        >
            <div className="flex w-full max-w-5xl flex-col items-center gap-5 md:gap-10 xl:max-w-[100rem]">
                <div className="flex w-full items-center justify-center gap-4">
                    <h2 className="text-2xl font-semibold uppercase md:text-3xl">
                        Our Blogs
                    </h2>
                </div>

                <div className="flex w-full flex-col bg-muted lg:flex-row">
                    <div className="flex w-full flex-col items-center gap-5 p-6 text-center md:gap-10 md:p-10">
                        <h2 className="max-w-lg text-balance text-2xl font-semibold md:text-4xl">
                            {offerData.title}
                        </h2>

                        <p className="max-w-lg text-balance text-sm text-muted-foreground md:text-base">
                            {offerData.description}
                        </p>

                        <button className="font-semibold uppercase underline underline-offset-2 md:text-lg">
                            {offerData.buttonText}
                        </button>
                    </div>

                    <div className="size-full">
                        <Image
                            src={offerData.img}
                            alt="Offer"
                            width={1000}
                            height={1000}
                            className="size-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
