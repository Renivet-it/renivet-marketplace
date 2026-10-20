"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ScrollReveal({
    children,
    delay = 0,
    className = "",
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.section
            initial={prefersReducedMotion ? false : { opacity: 0, y: 22, scale: 0.992 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-72px" }}
            transition={
                prefersReducedMotion
                    ? undefined
                    : { duration: 0.78, ease: [0.22, 1, 0.36, 1], delay }
            }
            className={className}
        >
            {children}
        </motion.section>
    );
}
