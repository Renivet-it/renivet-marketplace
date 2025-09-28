"use client";

import { useEffect, useMemo, useState } from "react";
import { NavbarHome, Footer, NavbarMob, GeneralShell } from "@/components/globals/layouts";
import { convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { Button } from "@/components/ui/button-general";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";
import { useRouter } from "next/navigation";
import CheckoutStepper from "./checkout-stepper"; // ✅ reuse your existing stepper
import Image from "next/image";

export default function GuestCartPage() {
  const router = useRouter();
  const [guestCart, setGuestCart] = useState<any[]>([]);

  // Load guest cart
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
    setGuestCart(cart);
  }, []);

  const itemsCount = useMemo(
    () => guestCart.reduce((acc, item) => acc + item.quantity, 0),
    [guestCart]
  );

  const totalPrice = useMemo(
    () => guestCart.reduce((acc, item) => acc + (item.price ?? 0) * item.quantity, 0),
    [guestCart]
  );

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header */}
      <NavbarHome />

      <main className="flex flex-1 flex-col">
        <GeneralShell>
          {/* Stepper (Bag → Address → Payment) */}
          <CheckoutStepper currentStep={0} /> {/* 👈 locked at Bag */}

          <div className="container mx-auto p-4">
            <div className="flex flex-col gap-6 md:flex-row">
              {/* Bag Section */}
              <div className="w-full rounded-lg bg-white p-4 shadow md:w-2/3">
                <h2 className="mb-4 text-lg font-semibold">Your Bag</h2>
                {guestCart.length === 0 ? (
                  <p className="text-gray-500">Your bag is empty.</p>
                ) : (
                  <ul className="space-y-4">
                    {guestCart.map((item, idx) => (
                      <li key={idx} className="flex gap-4 border-b pb-4">
                  <Image
                      src={
                        item.fullProduct?.media?.[0]?.mediaItem?.url ??
                        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                      }
                      alt={item.title || "Product image"}
                      width={80}
                      height={80}
                    className="h-30 w-30 rounded-md object-cover"
                    />
                        {/* <img
                          src={item.fullProduct?.media[0]?.mediaItem?.url ?? "/placeholder.png"}
                          alt={item.title}
                          className="h-20 w-20 rounded-md object-cover"
                        /> */}
                        <div className="flex flex-col justify-between">
                          <div>
                            <h3 className="font-medium">{item.title}</h3>
                            {item.brand && (
                              <p className="text-sm text-gray-500">{item.brand}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatPriceTag(+convertPaiseToRupees(item.price), true)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Summary Section */}
              <div className="w-full rounded-lg bg-white p-4 shadow md:w-1/3">
                <div className="mb-4 border-b pb-2">
                  <h2 className="text-lg font-semibold">Coupons</h2>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icons.Tag className="size-4 text-black" />
                      <span className="text-sm font-medium text-black">
                        Login to apply coupons
                      </span>
                    </div>
                    <button
                      disabled
                      className="cursor-not-allowed rounded-sm border border-gray-400 px-4 py-1 text-xs font-semibold text-gray-400"
                    >
                      APPLY
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Order Summary</h2>
                  <p className="text-sm text-gray-500">
                    You are about to place an order for {itemsCount} items with a
                    total of {formatPriceTag(+convertPaiseToRupees(totalPrice), true)}. 
                    Please login to continue.
                  </p>
                </div>

                <div className="space-y-2">
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        {formatPriceTag(+convertPaiseToRupees(totalPrice), true)}
                      </span>
                    </li>
                  </ul>
                  <Separator />
                  <div className="flex justify-between font-semibold text-destructive">
                    <span>Total:</span>
                    <span>
                      {formatPriceTag(+convertPaiseToRupees(totalPrice), true)}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      router.push("/auth/signin?redirect_url=/cart")
                    }
                  >
                    Login to checkout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </GeneralShell>
      </main>

      {/* Footer */}
      <Footer />
      <NavbarMob />
    </div>
  );
}
