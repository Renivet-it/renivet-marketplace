import { cn } from "@/lib/utils";
import { LucideProps } from "lucide-react";

export function Spinner({ className, ...props }: LucideProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("size-6 animate-spin", className)}
            {...(props as any)}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}
