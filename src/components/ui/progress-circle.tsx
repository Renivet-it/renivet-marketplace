"use client";
import * as React from "react";

interface ProgressCircleProps extends React.SVGProps<SVGSVGElement> {
    value: number; // actual value
    max?: number; // default max is 5
    size?: number; // width/height of SVG
    strokeWidth?: number;
    className?: string;
    label?: React.ReactNode;
    color?: string;
}

export function ProgressCircle({
    value,
    max = 5,
    size = 60,
    strokeWidth = 6,
    className,
    label,
    color = "#3b82f6", // Tailwind blue-500
    ...props
}: ProgressCircleProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / max, 1);
    const offset = circumference - progress * circumference;

    return (
        <div className={`relative w-[${size}px] h-[${size}px] ${className}`}>
            <svg
                width={size}
                height={size}
                className="rotate-[-90deg]"
                {...props}
            >
                <circle
                    stroke="#e5e7eb" // Tailwind gray-200
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                {label ?? `${value}/${max}`}
            </div>
        </div>
    );
}
