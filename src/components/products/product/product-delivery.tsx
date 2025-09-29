"use client";

import { useState, useTransition } from "react";
import { Icons } from "@/components/icons";
import { getEstimatedDelivery } from "@/actions/shiprocket/get-estimate-delivery";
import { trpc } from "@/lib/trpc/client";

// Define an Address type for the saved addresses
interface Address {
  id: string;
  name: string;
  pincode: string;
  address: string;
  label: string; // e.g., "HOME", "WORK"
}

interface DeliveryOptionProps {
  initialZipCode: string | undefined;
  warehousePincode: string | null | undefined;
  estimatedDelivery: string;
  setZipCode: (zip: string) => void;
  setEstimatedDelivery: (date: string) => void;
}

export function DeliveryOption({
  initialZipCode,
  warehousePincode,
  estimatedDelivery,
  setZipCode,
  setEstimatedDelivery,
}: DeliveryOptionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newZipCode, setNewZipCode] = useState(initialZipCode || "");
  const [tempSelectedAddress, setTempSelectedAddress] = useState<Address | null>(null); // Temporary selection in modal
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null); // Confirmed selection
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Fetch current user data using tRPC
  const { data: user, isPending: isUserFetching } = trpc.general.users.currentUser.useQuery();

  // Map user addresses to the Address type
  const savedAddresses: Address[] =
    user?.addresses?.map((addr: any) => ({
      id: addr.id,
      name: addr.fullName,
      pincode: addr.zip,
      address: `${addr.street}, ${addr.city}, ${addr.state}`,
      label: addr.type?.toUpperCase?.() || "HOME",
    })) || [];

  // Handle clicking the "Change/Check" button to open the modal
  const handleChangeClick = () => {
    setIsModalOpen(true);
    setNewZipCode(selectedAddress?.pincode || initialZipCode || "");
    setTempSelectedAddress(selectedAddress); // Pre-select the confirmed address
    setError("");
  };

  // Handle selecting an address from the saved addresses list
  const handleAddressSelect = (address: Address) => {
    setTempSelectedAddress(address);
    setNewZipCode(address.pincode); // Update pincode input
    setError(""); // Clear errors
  };

  // Handle form submission to check delivery estimate
  const handleZipCodeSubmit = async (e?: React.FormEvent) => {
    // allow calling from onClick too
    if (e && "preventDefault" in e) e.preventDefault();

    const deliveryPincode = parseInt(newZipCode, 10);
    // @ts-ignore
    const pickupPincode = parseInt(warehousePincode as any, 10);

    if (isNaN(deliveryPincode) || isNaN(pickupPincode)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    startTransition(async () => {
      try {
        setError(""); // Reset error state
        const result = await getEstimatedDelivery({
          pickupPostcode: pickupPincode,
          deliveryPostcode: deliveryPincode,
        });

        if (result?.data?.data?.available_courier_companies?.length > 0) {
          const estimatedDateStr = result.data.data.available_courier_companies[0].etd;

          if (!estimatedDateStr) {
            setError("Unable to retrieve estimated delivery date.");
            return;
          }

          const estimatedDate = new Date(estimatedDateStr);
          const today = new Date();

          if (isNaN(estimatedDate.getTime())) {
            setError("Invalid estimated delivery date received.");
            return;
          }

          if (estimatedDate <= today) {
            setError("Estimated delivery date must be in the future.");
            return;
          }

          const formattedDate = estimatedDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });

          // Set selected address for both saved and manual pincodes
          if (tempSelectedAddress) {
            setSelectedAddress(tempSelectedAddress); // Use saved address
          } else {
            setSelectedAddress({
              id: "manual",
              name: "Custom Pincode",
              pincode: newZipCode,
              address: "Manually entered pincode",
              label: "CUSTOM",
            }); // Create temporary address for manual pincode
          }

          setZipCode(newZipCode);
          setEstimatedDelivery(formattedDate);
          setTimeout(() => setIsModalOpen(false), 300); // Slight delay for better UX
        } else {
          setError(result.message || "No delivery options available for this pincode.");
        }
      } catch (err) {
        console.error("Failed to fetch delivery estimate:", err);
        setError("Failed to fetch delivery estimate. Please try again.");
      }
    });
  };

  return (
    <div className="delivery-option mb-4">
      {/* compact header */}
      <div className="flex items-center gap-2 text-gray-700 text-sm">
        <Icons.MapPin className="w-4 h-4" />
        <span className="font-medium">Delivery Options</span>
        <Icons.Truck className="w-4 h-4 ml-2" />
      </div>

      {/* compact inline box (matches screenshot). Clicking the button opens the modal */}
      <div className="mt-2">
        <div className="flex items-center border rounded-md bg-[#f4f0ec] px-3 py-2 w-fit">
          <span className="text-gray-600 text-sm mr-3">
            {estimatedDelivery ? `Delivery expected by ${estimatedDelivery}` : "Enter pincode to check delivery"}
          </span>

          {/* small check icon if a pincode is already selected */}
          {(selectedAddress || initialZipCode) && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-green-500 text-white rounded-full text-xs mr-2">✓</span>
          )}

          <button
            onClick={handleChangeClick}
            className="text-blue-600 font-medium hover:underline text-sm"
          >
            {user ? "Check" : "Check"}
          </button>
        </div>
      </div>

      {/* small helper line under box */}
      <div className="mt-2 text-gray-600 text-sm flex items-center gap-2">
        <Icons.Truck className="w-4 h-4" />
        {estimatedDelivery ? (
          <span>Get it by {estimatedDelivery}</span>
        ) : (
          <span>Enter pincode to check delivery date</span>
        )}
      </div>

      {/* === ORIGINAL MODAL (kept exactly, only minor formatting preserved) === */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#f4f0ec] p-6 rounded-lg shadow-lg w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Use Pincode to Check Delivery Info</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <span className="sr-only">Close</span>
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Enter Pincode Section */}
            <form onSubmit={handleZipCodeSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter a PIN code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newZipCode}
                    onChange={(e) => {
                      setNewZipCode(e.target.value);
                      setTempSelectedAddress(null); // Clear selected address when typing manually
                    }}
                    placeholder="Enter pincode"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    pattern="\d{6}"
                    required
                  />
                  {/* <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:bg-gray-100"
                  >
                    {isPending ? "Checking..." : "Check"}
                  </button> */}
                </div>
              </div>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            </form>

            {/* Saved Addresses Section */}
            {isUserFetching ? (
              <p className="text-sm text-gray-600 mb-4">Loading saved addresses...</p>
            ) : savedAddresses.length > 0 ? (
              <>
                <div className="flex items-center gap-2 my-4">
                  <hr className="flex-grow border-gray-300" />
                  <span className="text-sm text-gray-500">OR</span>
                  <hr className="flex-grow border-gray-300" />
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Select a saved address to check delivery info
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {savedAddresses.map((address) => (
                      <div
                        key={address.id}
                        className="flex items-start gap-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleAddressSelect(address)}
                      >
                        <input
                          type="radio"
                          name="saved-address"
                          checked={tempSelectedAddress?.id === address.id}
                          onChange={() => handleAddressSelect(address)}
                          className="mt-1"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {address.name}, {address.pincode}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-md">
                              {address.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{address.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {/* Modal Footer */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleZipCodeSubmit()}
                disabled={isPending || !newZipCode}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
              >
                {isPending ? "Checking..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
