"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button-general";
import { MarketingStrip as TypeMarketingStrip } from "@/lib/validations";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
        minutes: 3,
        seconds: 25,
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
    let displayItems = marketingStrip.slice(
        currentIndex,
        currentIndex + itemsPerView
    );

    if (displayItems.length < itemsPerView) {
        const remainingItems = marketingStrip.slice(0, itemsPerView - displayItems.length);
        displayItems = [...displayItems, ...remainingItems];
    }

    const handlePrev = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? marketingStrip.length - 1 : prev - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prev) =>
            prev === marketingStrip.length - 1 ? 0 : prev + 1
        );
    };

    return (
        <section
            className={cn(
                "bg-[#F4F0EC] flex w-full justify-center py-5 md:py-10 shadow-lg rounded-lg",
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
                       Two conscious choices. One stylish deal.
Thoughtfully made and effortlessly stylish—this month’s featured picks are all about looking good and feeling even better. Everyday essentials with a little extra meaning.
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
                                        {/* @ts-ignore */}
                                        {timeLeft[unit].toString().padStart(2, "0")}
                                    </span>
                                    <span className="text-[8px] md:text-xs text-gray-500 uppercase">
                                        {unit.slice(0, unit.length - 1)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Images (Carousel) */}
                <div className="w-1/2 flex flex-col items-center gap-2 md:gap-4">
                    {/* Images */}
                    <div className="flex items-center gap-2 md:gap-4 w-full">
                        {/* Left Image */}
                        <div
                            className="relative flex flex-col items-center bg-white rounded-md p-1 md:p-2 hover:shadow-md transition-shadow duration-200 w-[55%]"
                        >
                            <div className="overflow-hidden rounded-md w-full">
                                <Image
                                    src={displayItems[0].imageUrl}
                                    alt={displayItems[0].title}
                                    width={180}
                                    height={300}
                                    quality={85}
                                    className="h-[200px] md:h-[400px] w-full object-cover"
                                />
                            </div>
                            <div className="absolute bottom-8 md:bottom-16 left-2 md:left-4 bg-white p-1 md:p-3 rounded-md shadow-md">
                                <p className="text-[8px] md:text-sm text-gray-500">The Conscious Click</p>
                                {/* <p className="text-sm md:text-lg font-bold text-gray-800">25% OFF</p> */}
                            </div>
                        </div>

                        {/* Right Image */}
                        <div
                            className="relative flex flex-col items-center bg-white rounded-md p-1 md:p-2 hover:shadow-md transition-shadow duration-200 w-[45%]"
                        >
                            <div className="overflow-hidden rounded-md w-full">
                                <Image
                                    src={displayItems[1].imageUrl}
                                    alt={displayItems[1].title}
                                    width={150}
                                    height={300}
                                    quality={85}
                                    className="h-[200px] md:h-[400px] w-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Carousel Navigation (Arrows and Dots Below Images) */}
                    <div className="flex items-center justify-center gap-4 mt-2">
                        {/* Navigation Arrows */}
                        <button
                            onClick={handlePrev}
                            className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-300 hover:bg-gray-800 transition-colors duration-300 flex items-center justify-center"
                        >
                            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 text-gray-600 hover:text-white transition-colors duration-300" />
                        </button>

                        {/* Carousel Dots */}
                        <div className="flex gap-1 md:gap-2">
                            {marketingStrip.map((_, index) => (
                                <span
                                    key={index}
                                    className={cn(
                                        "w-2 h-2 md:w-3 md:h-3 rounded-full cursor-pointer",
                                        index === currentIndex ? "bg-gray-800" : "bg-gray-300",
                                        "hover:bg-gray-600 transition-colors duration-300"
                                    )}
                                    onClick={() => setCurrentIndex(index)}
                                />
                            ))}
                        </div>

                        {/* Right Arrow */}
                        <button
                            onClick={handleNext}
                            className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-300 hover:bg-gray-800 transition-colors duration-300 flex items-center justify-center"
                        >
                            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-600 hover:text-white transition-colors duration-300" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}