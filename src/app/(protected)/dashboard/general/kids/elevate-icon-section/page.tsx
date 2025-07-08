// components/sustainable-badges.tsx
import { BadgeCheck, Leaf, Sprout, Palette } from "lucide-react";

export const SustainableBadges = () => {
  return (
    <div className="bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* GOTS Certified */}
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="p-3 mb-3 rounded-full bg-green-50">
              <BadgeCheck className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="font-medium text-lg">GOTS Certified</h3>
            <p className="text-gray-600 mt-1">Organic Cotton</p>
          </div>

          {/* Sustainable */}
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="p-3 mb-3 rounded-full bg-green-50">
              <Leaf className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="font-medium text-lg">Sustainable</h3>
          </div>

          {/* Eco-Friendly */}
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="p-3 mb-3 rounded-full bg-green-50">
              <Sprout className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="font-medium text-lg">Eco-Friendly</h3>
          </div>

          {/* Non-Reactive Dyes */}
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="p-3 mb-3 rounded-full bg-green-50">
              <Palette className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="font-medium text-lg">Non-Reactive</h3>
            <p className="text-gray-600 mt-1">Dyes</p>
          </div>
        </div>
      </div>
    </div>
  );
};