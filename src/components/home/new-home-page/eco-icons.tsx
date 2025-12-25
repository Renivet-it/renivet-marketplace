"use client";

import { Check, Truck, RefreshCw } from "lucide-react";

export function EcoIcons() {
  const benefits = [
    {
      icon: Check,
      title: "Original products",
      description: "100% authentic"
    },
    {
      icon: Truck,
      title: "Free shipping",
      description: "on all orders"
    },
    {
      icon: RefreshCw,
      title: "Easy returns",
      description: "and refund"
    }
  ];

  return (
    <section className="w-full bg-[#FCFBF4]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <benefit.icon
                    className="w-5 h-5 text-gray-600" 
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-medium text-gray-800 mb-1">
                {benefit.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Page() {
  return (
    <div className="bg-[#F4F0EC]">
      <EcoIcons />
    </div>
  );
}