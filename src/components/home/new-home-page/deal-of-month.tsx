"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button-general";
import { MarketingStrip as TypeMarketingStrip } from "@/lib/validations";

interface PageProps extends GenericProps {
    marketingStrip: TypeMarketingStrip[];
}

export function DealofTheMonthStrip({
    className,
    marketingStrip,
    ...props
}: PageProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 2,
        hours: 6,
        minutes: 5,
        seconds: 30,
    });

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                let { days, hours, minutes, seconds } = prev;

                if (seconds > 0) seconds--;
                else {
                    seconds = 59;
                    if (minutes > 0) minutes--;
                    else {
                        minutes = 59;
                        if (hours > 0) hours--;
                        else {
                            hours = 23;
                            if (days > 0) days--;
                            else return { days: 0, hours: 0, minutes: 0, seconds: 0 };
                        }
                    }
                }

                return { days, hours, minutes, seconds };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentIndex((prev) => 
                prev === marketingStrip.length - 1 ? 0 : prev + 1
            );
        }, 5000);

        return () => clearInterval(slideInterval);
    }, [marketingStrip.length]);

    const itemsPerView = 2;
    const displayItems = marketingStrip.slice(
        currentIndex,
        currentIndex + itemsPerView
    );

    if (displayItems.length < itemsPerView) {
        const remainingItems = marketingStrip.slice(0, itemsPerView - displayItems.length);
        displayItems.push(...remainingItems);
    }

    return (
        <section
            className={cn(
                "flex w-full justify-center py-5 md:py-10 bg-white shadow-lg rounded-lg",
                className
            )}
            {...props}
        >
            <div className="w-full max-w-screen-xl mx-auto flex flex-row items-center gap-4 px-4">
                {/* Left Side - Text and Timer */}
                <div className="w-1/2 space-y-4">
                    <h2 className="text-lg md:text-3xl font-semibold text-gray-800 uppercase">
                        Deals of the Month
                    </h2>
                    <p className="text-gray-500 text-[10px] md:text-base">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sclerisque
                        duis ultricies sollicitudin aliquam sem. Sclerisque duis ultricies
                        sollicitudin.
                    </p>
                    <Button
                        asChild
                        className="inline-block bg-[#FFF3E3] text-gray-800 font-semibold py-1 px-2 md:py-3 md:px-6 rounded-md hover:bg-[#FFE0B2] transition-colors text-xs md:text-base"
                    >
                        <Link href="/shop">
                            Buy Now
                        </Link>
                    </Button>

                    {/* Countdown Timer */}
                    <div className="space-y-2">
                        <p className="text-xs md:text-lg font-semibold text-gray-800 uppercase">
                            Hurry, Before It’s Too Late!
                        </p>
                        <div className="flex gap-1 md:gap-3">
                            {["days", "hours", "minutes", "seconds"].map((unit, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col items-center bg-white rounded-md p-1 md:p-3 shadow-sm border border-gray-200"
                                >
                                    <span className="text-base md:text-xl font-bold text-gray-800">
                                        {timeLeft[unit].toString().padStart(2, "0")}
                                    </span>
                                    <span className="text-[8px] md:text-xs text-gray-500 uppercase">
                                        {unit.slice(0, unit.length - 1)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Carousel Dots */}
                    <div className="flex gap-1 md:gap-2 justify-center mt-2">
                        {marketingStrip.map((_, index) => (
                            <span
                                key={index}
                                className={cn(
                                    "w-1 h-1 md:w-3 md:h-3 rounded-full",
                                    index === currentIndex ? "bg-gray-800" : "bg-gray-400"
                                )}
                                onClick={() => setCurrentIndex(index)}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Side - Images (Carousel) */}
                <div className="w-1/2 flex gap-2 md:gap-4 justify-center">
                    {displayItems.map((item, index) => (
                        <div
                            key={index}
                            className="relative flex flex-col items-center bg-white rounded-md p-1 md:p-2 hover:shadow-md transition-shadow duration-200 w-[45%]"
                        >
                            <div className="overflow-hidden rounded-md w-full">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    width={index === 0 ? 150 : 100} // Scaled down for mobile
                                    height={200}
                                    quality={85}
                                    className="h-[150px] md:h-[300px] w-full object-cover"
                                />
                            </div>
                            {index === 0 && (
                                <div className="absolute bottom-8 md:bottom-16 left-2 md:left-4 bg-white p-1 md:p-3 rounded-md shadow-md">
                                    <p className="text-[8px] md:text-sm text-gray-500">01 — Special Offer</p>
                                    <p className="text-sm md:text-lg font-bold text-gray-800">30% OFF</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}