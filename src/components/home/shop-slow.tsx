// components/sustainable-badges.tsx
import { BadgeCheck, Leaf, Sprout, Palette } from "lucide-react";
import Link from "next/link";

const SustainableBadges = () => {
  return (
  <div className="space-y-0 pt-10">
      {/* Minimal Banner Section */}
      <div className="min-h-[30vh] flex  flex-col items-center justify-center bg-[#F4F0EC] px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-6 text-gray-800">
            &quot;Every Choice You Make Here Tells A Better Story.&quot;
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10">
            Be inspired by sleek shapes, fine fabrics
          </p>
          <Link
            href="/shop"
            className="inline-block border-2 border-black px-8 py-3 uppercase tracking-widest text-sm font-medium hover:bg-black hover:text-white transition-colors duration-300"
          >
            SHOP SLOW
          </Link>
        </div>
      </div>
      </div>

  );
};

export function Page() {
  return (
    <div>
      {/* Use the component */}
      <SustainableBadges />
    </div>
  );
}