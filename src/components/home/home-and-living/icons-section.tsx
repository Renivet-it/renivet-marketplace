// components/features-section.tsx
import { CreditCard, Truck, Headset } from "lucide-react";

export const FeaturesSection = () => {
  return (
    <div className="py-12 px-4 bg-[#c8bcc0]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Secure Payments */}
          <div className="flex flex-col items-center text-center">
            <CreditCard className="text-white w-10 h-10 mb-4" />
            <h3 className="text-white font-medium text-lg mb-2">Secure Payments</h3>
            <p className="text-white">
              Fesgiat mi gravido vestibulum oral ac voluptat non. Semper turpis sed macerosa.
            </p>
          </div>

          {/* Free Shipping */}
          <div className="flex flex-col items-center text-center">
            <Truck className="text-white w-10 h-10 mb-4" />
            <h3 className="text-white font-medium text-lg mb-2">Free Shipping</h3>
            <p className="text-white">
              Urna elementum eget quem feci la vulputate. Fesgiat mi gravido vestibulum oral.
            </p>
          </div>

          {/* 24/7 Support */}
          <div className="flex flex-col items-center text-center">
            <Headset className="text-white w-10 h-10 mb-4" />
            <h3 className="text-white font-medium text-lg mb-2">24/7 Support</h3>
            <p className="text-white">
              Semper turpis sed macerosa vivamus vel scelerisque. Aucher de turpis eu amet nulla.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export function Page() {
  return (
    <div>
      <FeaturesSection />
    </div>
  );
}