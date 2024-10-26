"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

const offerData = {
    title: "UP TO 40% OFF OUR CHRISTMAS COLLECTION",
    description:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit mattis sit phasellus mollis sit aliquam sit nullam neque ultrices.",
    buttonText: "Shop Now",
    img: "/images/offer1.png",
};

export function Offer({ className, ...props }: GenericProps) {
    return (
        <section
            className={cn(
                "flex justify-center px-4 py-5 md:px-8 md:py-10",
                className
            )}
            {...props}
        >
            <div className="flex w-full max-w-5xl flex-col items-center justify-between bg-muted md:flex-row xl:max-w-[100rem]">
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
        </section>
    );
}
