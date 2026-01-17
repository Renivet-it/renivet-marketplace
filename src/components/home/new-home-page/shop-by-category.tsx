"use client";

import { Button } from "@/components/ui/button-general";
import Image from "next/image";
import Link from "next/link";

export function ShopCategories() {
    const categories = [
        {
            name: "Men",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNcdSN8FeO4H8MeNYoyJQSarWCqgVpRxP5lDBu",
            href: "/men",
        },
        {
            name: "Women",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNPKE1D2O9kwm36pdODjHU0ryYqC2xJehFZ5Q7",
            href: "/women",
        },
        {
            name: "Kids",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNSLbuHrVko7HapsZqM8bNKQ6yVL5jDhwcr1AF",
            href: "/kids",
        },
        {
            name: "Home And Living",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNScHcA6Vko7HapsZqM8bNKQ6yVL5jDhwcr1AF",
            href: "/home-living",
        },
        {
            name: "Beauty And Care",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdBqjKmb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG",
            href: "/beauty-personal",
        },
    ];

    return (
        // This wrapper will hide the entire section on screens smaller than 'xl' (1280px )
        <div className="hidden xl:block">
            <section className="w-full bg-[#FCFBF4] py-8">
                <div className="flex justify-center">
                    <div
                        className="overflow-hidden rounded-lg border border-gray-200 shadow-sm"
                        style={{ width: "1652px", height: "357px" }}
                    >
                        <div className="flex h-full">
                            {/* Left Side - Text Content */}
                            <div
                                className="flex flex-col justify-center px-12"
                                style={{ width: "420px" }}
                            >
                                <div className="space-y-3">
                                    <h2 className="text-2xl font-light uppercase leading-tight text-gray-900">
                                        shop by category
                                    </h2>
                                    <p className="text-xs leading-relaxed text-gray-600">
                                        More than products — stories, values,
                                        and meaning in every category.
                                    </p>
                                    <div className="pt-1">
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="rounded-none border-gray-300 px-4 py-1.5 text-xs font-normal text-gray-700 hover:bg-[#FCFBF4] hover:text-black"
                                        >
                                            <Link href="/shop">
                                                › SHOP NEW IN
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Category Grid */}
                            <div className="flex flex-1 items-center justify-center">
                                <div className="flex w-full justify-between px-8">
                                    {categories.map((category, index) => (
                                        <Link
                                            key={index}
                                            href={category.href}
                                            prefetch={false}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.location.href =
                                                    category.href; // full page reload
                                            }}
                                            className="group flex flex-col items-center"
                                        >
                                            <div
                                                className="relative mb-1 overflow-hidden bg-gray-100"
                                                style={{
                                                    width: "180px",
                                                    height: "280px",
                                                }}
                                            >
                                                <Image
                                                    src={category.imageUrl}
                                                    alt={category.name}
                                                    fill
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    sizes="180px"
                                                />
                                            </div>
                                            <h3 className="text-xs font-normal text-gray-700">
                                                {category.name}
                                            </h3>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
