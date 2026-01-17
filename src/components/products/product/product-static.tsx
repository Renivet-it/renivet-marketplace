import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";

export const ProductCard = () => {
    return (
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-gray-300 bg-[#FCFBF4] p-8">
            {/* ✅ Overlay */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FCFBF4]/40 backdrop-blur-sm">
                <div className="text-center">
                    <h2 className="mb-2 flex items-center justify-center gap-2 text-4xl font-bold text-gray-900">
                        Decode X
                    </h2>
                    <h2 className="mb-2 flex items-center justify-center gap-2 text-4xl font-bold text-gray-900">
                        Behind The Product{" "}
                    </h2>
                    <p className="text-xl font-medium text-gray-700">
                        Coming Soon
                    </p>
                </div>
            </div>

            {/* ✅ Desktop: Full Blurred Content */}
            <div className="pointer-events-none hidden opacity-80 blur-[3px] md:block">
                {/* Original Full Desktop Content */}
                {/* Header */}
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                        <span className="text-lg text-white">🌱</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Decodex - Behind The Product
                    </h1>
                </div>

                <p className="mb-8 text-base leading-relaxed text-gray-600">
                    With Total Transparency, We Want To Tell Our Community The
                    Story And The Impact Behind Every Single Product To Help You
                    Make Better And Conscious Decisions.
                </p>

                {/* Product Values Section */}
                <div className="mb-12">
                    <div className="mb-8 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 underline decoration-2 underline-offset-4">
                            Product Values
                        </h2>
                        <ChevronUp className="h-6 w-6 text-gray-600" />
                    </div>

                    {/* Two Cards with Circular Progress */}
                    <div className="mb-8 grid grid-cols-2 gap-6">
                        {/* Water Saved Card */}
                        <div className="rounded-2xl border border-gray-200 bg-[#FCFBF4] p-6 shadow-sm">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <svg
                                        className="h-24 w-24 -rotate-90 transform"
                                        viewBox="0 0 100 100"
                                    >
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            stroke="#e5e7eb"
                                            strokeWidth="8"
                                            fill="none"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            stroke="#22c55e"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${
                                                2 * Math.PI * 40 * 0.64
                                            } ${2 * Math.PI * 40}`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-gray-900">
                                            64%
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            Saved
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                                        Water Saved
                                    </h3>
                                    <p className="mb-2 text-gray-700">
                                        80 L Compared To Fast Fashion
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        how do we calculate this?
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Fewer Toxic Compounds Card */}
                        <div className="rounded-2xl border border-gray-200 bg-[#FCFBF4] p-6 shadow-sm">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <svg
                                        className="h-24 w-24 -rotate-90 transform"
                                        viewBox="0 0 100 100"
                                    >
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            stroke="#e5e7eb"
                                            strokeWidth="8"
                                            fill="none"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            stroke="#22c55e"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${
                                                2 * Math.PI * 40 * 0.08
                                            } ${2 * Math.PI * 40}`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-gray-900">
                                            8%
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            Saved
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                                        Fewer Toxic Compounds
                                    </h3>
                                    <p className="mb-2 text-gray-700">
                                        78.9 Units Vs. Baseline
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        how do we calculate this?
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tags Row */}
                    <div className="mb-8 grid grid-cols-6 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="rounded-full border border-gray-200 bg-[#FCFBF4] px-4 py-3 text-center"
                            >
                                <p className="mb-1 text-xs text-gray-600">
                                    Tag
                                </p>
                                <p className="font-semibold text-gray-900">
                                    Value
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-4">
                        {["Softness", "Breathability", "Transparency"].map(
                            (item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4"
                                >
                                    <span className="w-24 text-sm font-medium text-gray-900">
                                        {item}
                                    </span>
                                    <div className="relative h-3 flex-1 rounded-full bg-gray-300">
                                        <div
                                            className="h-3 rounded-full bg-amber-800"
                                            style={{
                                                width: `${i === 0 ? 80 : i === 1 ? 100 : 20}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <span className="w-8 text-sm font-semibold text-gray-900">
                                        {i === 2 ? "" : `${i + 4}/5`}
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Product Journey Section */}
                <div>
                    <div className="mb-8 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 underline decoration-2 underline-offset-4">
                            Product Journey
                        </h2>
                        <ChevronDown className="h-6 w-6 text-gray-600" />
                    </div>

                    {/* Vertical Timeline */}
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-center">
                                <div className="h-6 w-6 rounded-full border-4 border-white bg-gray-300 shadow-sm"></div>
                                {i < 2 && (
                                    <div className="ml-4 h-0.5 w-16 bg-gray-300"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ✅ Mobile: Simplified Layout */}
            <div className="pointer-events-none block opacity-80 blur-[2px] md:hidden">
                <div className="flex flex-col items-center gap-6">
                    {/* Circular Progress */}
                    <div className="flex w-full items-center gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow">
                        <div className="relative">
                            <svg
                                className="h-20 w-20 -rotate-90 transform"
                                viewBox="0 0 100 100"
                            >
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    stroke="#e5e7eb"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    stroke="#22c55e"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 40 * 0.64} ${
                                        2 * Math.PI * 40
                                    }`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900">
                                    64%
                                </span>
                                <span className="text-xs text-gray-600">
                                    Saved
                                </span>
                            </div>
                        </div>
                        <div>
                            <h3 className="mb-1 text-base font-semibold text-gray-900">
                                Water Saved
                            </h3>
                            <p className="mb-1 text-sm text-gray-700">
                                80 L Compared To Fast Fashion
                            </p>
                        </div>
                    </div>

                    {/* Metric Cards */}
                    <div className="flex w-full items-center justify-center gap-4">
                        <div className="w-1/2 rounded-full border border-gray-300 bg-white px-4 py-2 text-center text-sm text-gray-900 shadow">
                            water saved:{" "}
                            <span className="font-semibold">2,500 l</span>
                        </div>
                        <div className="w-1/2 rounded-full border border-gray-300 bg-white px-4 py-2 text-center text-sm text-gray-900 shadow">
                            co₂ avoided:{" "}
                            <span className="font-semibold">1.2 kg</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
