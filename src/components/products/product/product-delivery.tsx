"use client";

import { useState, useTransition } from "react";
import { Icons } from "@/components/icons";
import { getEstimatedDelivery } from "@/actions/shiprocket/get-estimate-delivery";

interface DeliveryOptionProps {
  initialZipCode: string;
  warehousePincode: string;
  initialEstimatedDelivery: string;
}

export function DeliveryOption({
  initialZipCode,
  warehousePincode,
  initialEstimatedDelivery,
}: DeliveryOptionProps) {
  const [zipCode, setZipCode] = useState(initialZipCode);
  const [estimatedDelivery, setEstimatedDelivery] = useState(initialEstimatedDelivery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newZipCode, setNewZipCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleChangeClick = () => {
    setIsModalOpen(true);
    setNewZipCode(zipCode);
    setError("");
  };

  const handleZipCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse pincodes to integers
    const deliveryPincode = parseInt(newZipCode, 10);
    const pickupPincode = parseInt(warehousePincode, 10);

    if (isNaN(deliveryPincode) || isNaN(pickupPincode)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    startTransition(async () => {
      const result = await getEstimatedDelivery({
        pickupPostcode: pickupPincode,
        deliveryPostcode: deliveryPincode,
      });

      if (result.data.data?.available_courier_companies?.length > 0) {
        const estimatedDateStr = result.data.data.available_courier_companies[0].etd; // e.g., "2025-05-26"
console.log("Estimated delivery date:", result.data);
        // Parse the estimated delivery date
        const estimatedDate = new Date(estimatedDateStr);
        const today = new Date("2025-05-21T01:16:00+05:30"); // Current date and time: May 21, 2025, 01:16 AM IST

        // Validate that the estimated date is in the future
        if (estimatedDate <= today) {
          setError("Estimated delivery date must be in the future.");
          return;
        }

        // Format the date to "Mon, May 26"
        const formattedDate = estimatedDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        setZipCode(newZipCode);
        setEstimatedDelivery(formattedDate);
        setIsModalOpen(false);
      } else {
        setError(result.message || "Failed to fetch delivery estimate.");
      }
    });
  };

  return (
    <div className="delivery-option mb-4">
      <div className="flex items-center gap-2">
        <h4 className="uppercase text-sm font-bold text-gray-800 flex items-center gap-1">
          Delivery Options
          <Icons.Truck className="w-5 h-5 text-gray-600" />
        </h4>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-gray-800">{zipCode}</span>
          <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
            ✓
          </span>
        </div>
        <button
          onClick={handleChangeClick}
          className="text-red-500 font-semibold text-sm hover:underline focus:outline-none"
        >
          CHANGE
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 text-gray-600">
        <Icons.Truck className="w-5 h-5" />
        <span className="text-sm">Get it by {estimatedDelivery}</span>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Enter Your Pincode</h3>
            <form onSubmit={handleZipCodeSubmit}>
              <input
                type="text"
                value={newZipCode}
                onChange={(e) => setNewZipCode(e.target.value)}
                placeholder="Enter pincode"
                className="w-full p-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                pattern="\d{6}"
                required
              />
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {isPending ? "Checking..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}