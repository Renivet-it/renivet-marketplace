import { ShieldCheck, User, Package, Truck } from "lucide-react";

const ServiceBadges = () => {
  return (
    <div className="bg-[#F4EEDC] mt-10 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* 100% Original & Authentic */}
          <div className="flex flex-col items-center">
            <div className="p-4 mb-3 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="text-yellow-700 w-8 h-8" />
            </div>
            <h3 className="font-semibold text-center text-[16px]">100% Original &amp; Authentic</h3>
          </div>
          {/* Customer First */}
          <div className="flex flex-col items-center">
            <div className="p-4 mb-3 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm">
              <User className="text-yellow-700 w-8 h-8" />
            </div>
            <h3 className="font-semibold text-center text-[16px]">Customer First</h3>
          </div>
          {/* Zero Waste Packaging */}
          <div className="flex flex-col items-center">
            <div className="p-4 mb-3 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Package className="text-yellow-700 w-8 h-8" />
            </div>
            <h3 className="font-semibold text-center text-[16px]">Zero Waste Packaging</h3>
          </div>
          {/* Reliable And Free Shipping */}
          <div className="flex flex-col items-center">
            <div className="p-4 mb-3 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Truck className="text-yellow-700 w-8 h-8" />
            </div>
            <h3 className="font-semibold text-center text-[16px]">Reliable And Free Shipping</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export function Page() {
  return (
    <div>
      <ServiceBadges />
    </div>
  );
}