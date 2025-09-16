// components/sustainable-badges.tsx
import { BadgeCheck, Leaf, Sprout, Palette } from "lucide-react";

const SustainableBadges = () => {
  return (
    <div className="bg-[#F4F0EC]  py-2 sm:py-12 px-2 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* GOTS Certified */}
          <div className="flex flex-col items-center">
            <div className="p-4 mb-3 w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-sm">
              <BadgeCheck className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="font-medium text-center">GOTS Certified</h3>
            <p className="text-gray-600 text-sm text-center">Organic Cotton</p>
          </div>

          {/* Sustainable */}
          <div className="flex flex-col items-center">
            <div className="p-4 mb-3 w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Leaf className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="font-medium text-center">Sustainable</h3>
          </div>

          {/* Eco-Friendly */}
          <div className="flex flex-col items-center">
            <div className="p-4 mb-3 w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Sprout className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="font-medium text-center">Eco-Friendly</h3>
          </div>

          {/* Non-Reactive Dyes */}
          <div className="flex flex-col items-center">
            <div className="p-4 mb-3 w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Palette className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="font-medium text-center">Non-Reactive</h3>
            <p className="text-gray-600 text-sm text-center">Dyes</p>
          </div>
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