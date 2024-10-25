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
            className={cn("flex justify-center py-5 md:py-10", className)}
            {...props}
        >
            <div className="flex w-full max-w-[100rem] flex-col items-center justify-between bg-muted md:flex-row">
                <div className="flex w-full flex-col items-center space-y-10 p-6 text-center md:p-10">
                    <h2 className="max-w-lg text-balance text-4xl font-semibold">
                        {offerData.title}
                    </h2>

                    <p className="max-w-lg text-balance text-muted-foreground">
                        {offerData.description}
                    </p>

                    <button className="text-lg font-semibold uppercase underline underline-offset-2">
                        {offerData.buttonText}
                    </button>
                </div>

                <div className="flex w-full justify-center">
                    <Image
                        src={offerData.img}
                        alt="Offer"
                        width={1000}
                        height={1000}
                    />
                </div>
            </div>
        </section>
    );
}
