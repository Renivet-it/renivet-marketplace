"use client";

import { Check, RefreshCw, Truck } from "lucide-react";

export function EcoIcons() {
    const benefits = [
        {
            icon: Check,
            title: "Original products",
            description: "100% authentic",
        },
        {
            icon: Truck,
            title: "Free shipping",
            description: "on all orders",
        },
        {
            icon: RefreshCw,
            title: "Easy returns",
            description: "and refund",
        },
    ];

    return (
        <section className="w-full bg-[#FCFBF4]">
            <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
                {/* Benefits Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:gap-8">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="group text-center">
                            {/* Icon */}
                            <div className="mb-4 flex justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                                    <benefit.icon
                                        className="h-5 w-5 text-gray-600"
                                        strokeWidth={1.5}
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="mb-1 text-lg font-medium text-gray-800">
                                {benefit.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-gray-600">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function Page() {
    return (
        <div className="bg-[#FCFBF4]">
            <EcoIcons />
        </div>
    );
}
