import { CheckoutPage } from "@/components/checkout";
import { GeneralShell } from "@/components/globals/layouts";
import { userCache, userCartCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Script from "next/script";
import { Suspense } from "react";

export default function Page() {
    return (
        <GeneralShell>
            <Suspense>
                <CheckoutFetch />
            </Suspense>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        </GeneralShell>
    );
}

async function CheckoutFetch() {
    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    const [data, currentUser] = await Promise.all([
        userCartCache.get(userId),
        userCache.get(userId),
    ]);
    if (!currentUser) redirect("/auth/signin");
    const filtered = data.filter((item) => item.status);

    return <CheckoutPage initialData={filtered} user={currentUser} />;
}
