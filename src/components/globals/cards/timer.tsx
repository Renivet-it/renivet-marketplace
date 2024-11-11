"use client";

import { useNavbarStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function CountdownStrip() {
    const isNavbarOpen = useNavbarStore((state) => state.isOpen);

    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const targetDate = new Date("2025-01-17T00:00:00");

        const interval = setInterval(() => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            const d = Math.floor(difference / (1000 * 60 * 60 * 24));
            const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const m = Math.floor((difference / 1000 / 60) % 60);
            const s = Math.floor((difference / 1000) % 60);

            setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });

            if (difference < 0) {
                clearInterval(interval);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className={cn(
                "w-full bg-foreground p-2 shadow-lg",
                isNavbarOpen ? "hidden" : "block"
            )}
        >
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center text-xs font-bold text-background md:text-sm"
            >
                <p className="flex -skew-x-12 items-center gap-2">
                    <span>Coming Soon</span>

                    {Object.entries(timeLeft).map(([unit, value]) => (
                        <motion.span
                            key={unit}
                            className="inline-block rounded-md bg-white/20 px-2 py-1"
                            initial={{ scale: 1 }}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{
                                duration: 0.5,
                                repeatType: "reverse",
                            }}
                        >
                            {value.toString().padStart(2, "0")}
                            <span className="ml-1 text-xs">
                                {unit.charAt(0)}
                            </span>
                        </motion.span>
                    ))}

                    <motion.span
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    >
                        ✨
                    </motion.span>
                </p>
            </motion.div>
        </div>
    );
}
