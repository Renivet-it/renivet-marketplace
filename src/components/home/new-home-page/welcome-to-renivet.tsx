"use client";

import { Icons } from "@/components/icons";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function WelcomeRenivet() {
    return (
        <section className="relative w-full overflow-hidden bg-white py-8 md:py-16">
            {/* Background Decorative Element */}
            <div className="absolute right-0 top-0 -z-10 hidden translate-x-1/2 -translate-y-1/2 opacity-[0.03] lg:block">
                <Icons.Leaf size={600} />
            </div>

            <div className="mx-auto max-w-screen-3xl px-4 sm:px-6 lg:px-8">
                <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-24">
                    {/* LEFT IMAGE - Interactive with Hover Effect */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="group relative aspect-[1/1.1] w-full overflow-hidden rounded-2xl bg-[#fbfaf4] shadow-2xl md:aspect-[1.1/1]"
                    >
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNQX1mcOvbyYEoZ78eJzNIKWdcxq1Of9wlHtAT"
                            alt="Renivet Circle"
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />

                        {/* Decorative Badge on Image */}
                        <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12">
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="font-serif text-lg italic leading-tight text-white drop-shadow-lg sm:text-xl md:text-3xl lg:text-4xl"
                            >
                                "One Thread. <br /> Many Conscious Brands."
                            </motion.p>
                        </div>
                    </motion.div>

                    {/* RIGHT CONTENT */}
                    <div className="flex flex-col items-start text-left lg:pr-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#7A6338] opacity-80 md:text-[11px]">
                                Our Collective
                            </span>

                            <h2 className="mt-3 font-serif text-[28px] font-light leading-tight text-gray-900 sm:text-4xl md:mt-4 md:text-5xl lg:text-6xl xl:text-7xl">
                                Welcome to the <br />
                                <span className="italic underline decoration-[#7A6338]/20 underline-offset-8 text-[#7A6338]">
                                    Renivet Circle
                                </span>
                            </h2>
                        </motion.div>

                        {/* Interactive Icons */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4, duration: 1 }}
                            className="mt-8 flex flex-wrap gap-5 text-gray-400 sm:gap-8 md:mt-10"
                        >
                            {[
                                { Icon: Icons.Leaf, label: "Sustainable" },
                                { Icon: Icons.Recycle, label: "Eco-Friendly" },
                                { Icon: Icons.Footprints, label: "Ethical" },
                                { Icon: Icons.Heart, label: "Handmade" },
                                { Icon: Icons.Globe, label: "Conscious" },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -8, color: "#7A6338" }}
                                    className="group/icon cursor-pointer transition-colors flex flex-col items-center gap-2"
                                >
                                    <item.Icon
                                        size={24}
                                        strokeWidth={1.25}
                                        className="transition-transform group-hover/icon:scale-110 md:size-7"
                                    />
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 transition-all group-hover/icon:-translate-y-1 group-hover/icon:opacity-100 md:text-[10px]">
                                        {item.label}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="mt-8 space-y-6 text-base leading-relaxed text-gray-600 sm:text-lg md:mt-12 md:space-y-8 md:text-xl"
                        >
                            <p className="border-l-2 border-[#7A6338]/30 pl-4 italic font-medium text-gray-900 md:pl-6">
                                Renivet isn’t just a marketplace — it’s a
                                curated space of discovery.
                            </p>
                            <p className="max-w-[580px]">
                                We connect you with brands that are sustainable,
                                homegrown, and crafted with intention. Every
                                piece here tells a story — of craft, culture,
                                and conscious creation.
                            </p>
                            <p className="font-serif italic text-gray-900">
                                Thoughtful creation meets{" "}
                                <span className="font-sans font-bold not-italic text-[#7A6338]">
                                    thoughtful living.
                                </span>
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                            className="mt-10 w-full md:mt-14 md:w-auto"
                        >
                            <Link
                                href="/about"
                                className="group relative inline-flex w-full items-center justify-center gap-4 overflow-hidden rounded-full bg-gray-900 px-8 py-4 text-[11px] font-bold tracking-[0.2em] text-white shadow-lg transition-all active:scale-95 md:w-auto md:px-10 md:py-5 md:text-[12px] hover:bg-[#7A6338] hover:pr-14"
                            >
                                <span className="relative z-10">
                                    DISCOVER OUR STORY
                                </span>
                                <Icons.ArrowRight
                                    className="absolute right-6 translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                                    size={20}
                                />

                                {/* Button Hover Background Effect */}
                                <div className="absolute inset-0 z-0 translate-y-full bg-white/10 transition-transform duration-300 group-hover:translate-y-0" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
