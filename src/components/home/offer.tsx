"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const offerData = {
    title: "UP TO 40% OFF OUR CHRISTMAS COLLECTION",
    description:
        "Bring the festive spirit to your home with our Christmas collection. Try our new arrivals and get up to 40% off.",
    buttonText: "Shop Now",
    img: "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnkIvOIZt9nCdcN8sTjeLbGJYa2tlumUyWIOHK",
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
                <div className="flex w-full flex-col items-center gap-5 p-10 text-center md:gap-10">
                    <h2 className="max-w-lg text-balance text-2xl font-semibold md:text-4xl">
                        {offerData.title}
                    </h2>

                    <p className="max-w-lg text-balance text-sm text-muted-foreground md:text-base">
                        {offerData.description}
                    </p>

                    <Link
                        className="font-semibold uppercase underline underline-offset-2 md:text-lg"
                        href="/shop"
                    >
                        {offerData.buttonText}
                    </Link>
                </div>

                <div className="h-60 w-full overflow-hidden md:h-[30rem]">
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
