"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const Footer: React.FC = () => {
    return (
        <footer className="py bg-[#30343F] px-8 text-[#9B9B9B] md:px-20">
            {/* Top section with logo, button, and divider */}
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
                <div className="mt-10 flex flex-col items-center md:items-start md:pr-16">
                    {/* Logo Section */}
                    <h1 className="text-2xl font-bold tracking-wide text-white">
                        MOON.
                    </h1>
                    <p className="max-w- mb-10 mt-4 text-center leading-relaxed md:text-left">
                        Lorem ipsum dolor sit amet consectetur adipiscing elit
                        aliquam mauris sed ma
                    </p>
                    {/* Get Started Button */}
                    <Button
                        variant="outline"
                        className="min-w-40 rounded-none border-accent bg-transparent"
                        size="lg"
                        asChild
                    >
                        <Link
                            href="/"
                            className="text-lg font-semibold text-accent"
                        >
                            View All
                        </Link>
                    </Button>
                </div>

                {/* Divider: vertical for large screens, horizontal for smaller screens */}
                <div className="mx-8 w-full border-t border-white md:h-[45vh] md:w-auto md:border-l md:border-t-0"></div>

                {/* Bottom Section with Links */}
                <div className="grid w-full grid-cols-2 gap-10 text-sm md:mt-0 md:grid-cols-3">
                    {/* About Us */}
                    <div className="mt-10">
                        <h2 className="mb-6 font-semibold text-white">
                            ABOUT US
                        </h2>
                        <ul className="space-y-3">
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Mission
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Our team
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Awards
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Testimonials
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Privacy policy
                            </li>
                        </ul>
                    </div>
                    {/* Services */}
                    <div className="mt-10">
                        <h2 className="mb-6 font-semibold text-white">
                            SERVICES
                        </h2>
                        <ul className="space-y-3">
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Web design
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Web development
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Mobile design
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                UI/UX design
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Branding design
                            </li>
                        </ul>
                    </div>
                    {/* Portfolio */}
                    <div className="mb-4 mt-10">
                        <h2 className="mb-6 font-semibold text-white">
                            PORTFOLIO
                        </h2>
                        <ul className="space-y-3">
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Corporate websites
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                E-commerce
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Mobile apps
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                Landing pages
                            </li>
                            <li className="cursor-pointer transition-colors hover:text-white">
                                UI/UX projects
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Footer Bottom Section */}
            <div className="mb-4 flex flex-col items-center justify-between border-t border-white pt-6 md:flex-row">
                <p className="text-xs text-[#828282]">
                    &copy; 2023 Moon | All Rights Reserved
                </p>
                <div className="mt-4 flex gap-6 md:mt-0">
                    <a
                        href="#"
                        className="text-xs text-[#828282] transition-colors hover:text-white"
                    >
                        Terms and Conditions
                    </a>
                    <a
                        href="#"
                        className="text-xs text-[#828282] transition-colors hover:text-white"
                    >
                        Privacy Policy
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
