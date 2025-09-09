"use client";

import { Check, Truck, RefreshCw } from "lucide-react";

export function EcoIcons() {
  const benefits = [
    {
      icon: Check,
      title: "Original products",
      description: "100% authentic",
    },
    {
      icon: Truck,
      title: "Free shipping",
      description: "on all orders",
    },
    {
      icon: RefreshCw,
      title: "Easy returns",
      description: "and refund",
    },
  ];

  return (
    <section className="w-full bg-[#F4F0EC] py-4 sm:py-12">
      <div className="max-w-screen-xl mx-auto px-2 sm:px-6">
        {/* ---------------------------- DESKTOP GRID ---------------------------- */}
        <div className="hidden sm:grid grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <benefit.icon className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-1">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* ---------------------------- MOBILE ROW ---------------------------- */}
        <div className="sm:hidden flex justify-between gap-2 overflow-x-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex-1 min-w-[90px] bg-white rounded-lg p-3 shadow-sm flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <benefit.icon className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-xs font-medium text-gray-900">{benefit.title}</h3>
              <p className="text-[10px] text-gray-500">{benefit.description}</p>
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
