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
            className={cn("flex justify-center py-5 md:py-10", className)}
            {...props}
        >
            <div className="w-full max-w-[100rem] space-y-10">
                <div className="flex items-center justify-center gap-4">
                    <h2 className="text-3xl font-semibold uppercase">
                        Our Blogs
                    </h2>
                </div>

                <div className="flex flex-col items-center bg-muted md:flex-row">
                    <div className="flex w-full flex-col items-center gap-4 py-10 text-center">
                        <h2 className="max-w-md text-balance text-4xl font-semibold">
                            {offerData.title}
                        </h2>

                        <p className="max-w-xl text-balance text-muted-foreground">
                            {offerData.description}
                        </p>

                        <button className="text-lg font-semibold uppercase underline underline-offset-2">
                            {offerData.buttonText}
                        </button>
                    </div>

                    <div className="w-full">
                        <Image
                            src={offerData.img}
                            alt="Offer"
                            width={1000}
                            height={1000}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
