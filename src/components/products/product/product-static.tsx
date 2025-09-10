import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export const ProductCard = () => {
  return (
    <div className="relative max-w-7xl mx-auto p-8 bg-[#f4f0ec] rounded-3xl border border-gray-300 overflow-hidden">
      {/* ✅ Overlay */}
      <div className="absolute inset-0 bg-[#f4f0ec]/40 backdrop-blur-sm flex flex-col items-center justify-center z-20">
        <div className="text-center">
          <h2 className="text-gray-900 text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            Decode X
          </h2>
                    <h2 className="text-gray-900 text-4xl font-bold mb-2 flex items-center justify-center gap-2">
Behind The Product          </h2>
          <p className="text-gray-700 text-xl font-medium">Coming Soon</p>
        </div>
      </div>

      {/* ✅ Desktop: Full Blurred Content */}
      <div className="opacity-80 blur-[3px] pointer-events-none hidden md:block">
        {/* Original Full Desktop Content */}
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🌱</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Decodex - Behind The Product
          </h1>
        </div>

        <p className="text-gray-600 mb-8 text-base leading-relaxed">
          With Total Transparency, We Want To Tell Our Community The Story And
          The Impact Behind Every Single Product To Help You Make Better And
          Conscious Decisions.
        </p>

        {/* Product Values Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 underline decoration-2 underline-offset-4">
              Product Values
            </h2>
            <ChevronUp className="w-6 h-6 text-gray-600" />
          </div>

          {/* Two Cards with Circular Progress */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Water Saved Card */}
            <div className="bg-[#f4f0ec] rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg
                    className="w-24 h-24 transform -rotate-90"
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
                    <span className="text-sm text-gray-600">Saved</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Water Saved
                  </h3>
                  <p className="text-gray-700 mb-2">
                    80 L Compared To Fast Fashion
                  </p>
                  <p className="text-gray-400 text-sm">
                    how do we calculate this?
                  </p>
                </div>
              </div>
            </div>

            {/* Fewer Toxic Compounds Card */}
            <div className="bg-[#f4f0ec] rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg
                    className="w-24 h-24 transform -rotate-90"
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
                    <span className="text-sm text-gray-600">Saved</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Fewer Toxic Compounds
                  </h3>
                  <p className="text-gray-700 mb-2">78.9 Units Vs. Baseline</p>
                  <p className="text-gray-400 text-sm">
                    how do we calculate this?
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags Row */}
          <div className="grid grid-cols-6 gap-3 mb-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-[#f4f0ec] rounded-full px-4 py-3 text-center border border-gray-200"
              >
                <p className="text-xs text-gray-600 mb-1">Tag</p>
                <p className="font-semibold text-gray-900">Value</p>
              </div>
            ))}
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            {["Softness", "Breathability", "Transparency"].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm text-gray-900 w-24 font-medium">
                  {item}
                </span>
                <div className="flex-1 bg-gray-300 rounded-full h-3 relative">
                  <div
                    className="bg-amber-800 h-3 rounded-full"
                    style={{
                      width: `${i === 0 ? 80 : i === 1 ? 100 : 20}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-8">
                  {i === 2 ? "" : `${i + 4}/5`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Journey Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 underline decoration-2 underline-offset-4">
              Product Journey
            </h2>
            <ChevronDown className="w-6 h-6 text-gray-600" />
          </div>

          {/* Vertical Timeline */}
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-6 h-6 bg-gray-300 rounded-full border-4 border-white shadow-sm"></div>
                {i < 2 && <div className="ml-4 h-0.5 w-16 bg-gray-300"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Mobile: Simplified Layout */}
      <div className="opacity-80 blur-[2px] pointer-events-none block md:hidden">
        <div className="flex flex-col items-center gap-6">
          {/* Circular Progress */}
          <div className="flex items-center gap-6 bg-white rounded-xl p-6 shadow border border-gray-200 w-full">
            <div className="relative">
              <svg
                className="w-20 h-20 transform -rotate-90"
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
                <span className="text-2xl font-bold text-gray-900">64%</span>
                <span className="text-xs text-gray-600">Saved</span>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Water Saved
              </h3>
              <p className="text-gray-700 text-sm mb-1">
                80 L Compared To Fast Fashion
              </p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="border border-gray-300 rounded-full px-4 py-2 bg-white text-gray-900 text-center shadow text-sm w-1/2">
              water saved: <span className="font-semibold">2,500 l</span>
            </div>
            <div className="border border-gray-300 rounded-full px-4 py-2 bg-white text-gray-900 text-center shadow text-sm w-1/2">
              co₂ avoided: <span className="font-semibold">1.2 kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
