"use client";

import Image from "next/image";
import Link from "next/link";

export function MobileCategories() {
    const categories = [
        {
            title: "Indian Wear",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNzQ7NO8wvAfHxUCD4uo0de9jTMakKRhw8ctYL",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=0cb0f01f-4c17-47ff-8251-4ea5a7a65a09&productTypeId=0f13d48d-50de-43ec-8bab-a7bfbbcf8773",
        },
        {
            title: "Western Wear",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdhPFJaWb4imNMJ6l9SbIRxWLcDyX3vTqk2UV",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=f050d1bc-f435-45fc-ac22-47942a4d4a74",
        },
        {
            title: "Foot Wear",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN8g1QARjj1qpSPZJEOTHVgaenl2yArM78zCkm",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=4489ecbd-cb3e-47f0-aced-defcf134629b",
        },
        {
            title: "Shirts",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNvWCA90dPZsh5fuDbkAelMyqICmp3NU7X4nHY",
            link: "https://renivet.com/shop?categoryId=0b7046fc-6962-4469-81c2-412ed6949c02&subcategoryId=7f1e41e3-e7a9-46ef-aaf6-f0e0a37a971d&productTypeId=e027b0df-5287-4114-849d-1f3bfc05e594",
        },
        {
            title: "Accessories",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNawKqqt9B8YEoL1wGJl0ZibnpvNAMuVzCFqKc",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=32674fe3-d167-4b48-914b-0819b17a2292",
        },
        {
            title: "Home Decor",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNhlQssEPAwZ71xI8cmpPRY6WBO42eGEJfosyi",
            link: "https://renivet.com/shop?categoryId=173e1e71-e298-4301-b542-caa29d3950bf",
        },
        {
            title: "Handbags",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNVZ18VKBbpNcg6ZSKi0IGkAsjuLwQox3znmlt",
            link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=711eac71-1676-40eb-b637-7e4074d542d0",
        },
        {
            title: "Kids",
            imageUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNjgHih7umPpnZoHc5f2E4rFNLugdK3ty9ObjY",
            link: "https://renivet.com/shop?categoryId=22816fa3-d57e-4e3b-bc0e-72edf4635124",
        },
    ];

    return (
        <>
            {/* Mobile: 4-col grid */}
            <section className="block w-full bg-[#FCFBF4] px-4 py-6 md:hidden">
                <div className="grid grid-cols-4 place-items-center gap-x-3 gap-y-6">
                    {categories.map((item, index) => (
                        <Link
                            key={index}
                            href={item.link}
                            className="flex flex-col items-center"
                        >
                            {item.title === "Accessories" ? (
                                <div className="perspective size-[78px]">
                                    <div className="flip-card">
                                        <div className="card-face card-front relative h-full w-full overflow-hidden">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.title}
                                                fill
                                                sizes="78px"
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="card-face card-back">
                                            <p className="text-[10px] leading-tight text-[#333]">
                                                Buy Any 2
                                            </p>
                                            <p className="text-[11px] font-semibold text-[#000]">
                                                Get 15% Off
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative size-[78px] overflow-hidden">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        sizes="78px"
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <p className="mt-2 text-center text-[12px] leading-tight text-[#333]">
                                {item.title}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Desktop: horizontal row with round images */}
            <section className="hidden w-full bg-[#FCFBF4] py-10 md:block">
                <div className="flex items-start justify-between px-12">
                    {categories.map((item, index) => (
                        <Link
                            key={index}
                            href={item.link}
                            className="group flex flex-col items-center gap-3"
                        >
                            <div className="relative size-[130px] overflow-hidden rounded-full border-2 border-transparent bg-white shadow-sm transition-all duration-300 group-hover:border-[#c5d1b8] group-hover:shadow-md">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    sizes="130px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            </div>
                            <p className="text-center text-sm font-medium text-[#333] transition-colors group-hover:text-[#6B7A5E]">
                                {item.title}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ✅ CSS INSIDE SAME FILE */}
            <style jsx>{`
                .perspective {
                    perspective: 1000px;
                }

                .flip-card {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    animation: flip 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                @keyframes flip {
                    0% {
                        transform: rotateY(0deg);
                    }
                    25% {
                        transform: rotateY(0deg);
                    }
                    50% {
                        transform: rotateY(180deg);
                    }
                    75% {
                        transform: rotateY(180deg);
                    }
                    100% {
                        transform: rotateY(0deg);
                    }
                }

                .card-face {
                    position: absolute;
                    inset: 0;
                    backface-visibility: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }

                .card-front {
                    background: transparent;
                }

                .card-back {
                    background: #efe7da;
                    transform: rotateY(180deg);
                    flex-direction: column;
                }
            `}</style>
        </>
    );
}
