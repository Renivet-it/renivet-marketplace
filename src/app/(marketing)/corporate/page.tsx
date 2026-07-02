import { GeneralShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Corporate Procurement",
    description: "Browse the Renivet corporate catalog and launch managed procurement workflows.",
};

export default async function Page() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/auth/signin?redirect_url=/corporate");
    }

    const [catalog, profile] = await Promise.all([
        corporatePlatformService.listCatalog({ page: 1, limit: 12 }),
        corporatePlatformService.getMyProfile(userId),
    ]);

    return (
        <GeneralShell>
            <div className="space-y-8">
                <section className="rounded-[32px] border border-[#d8e3ef] bg-[linear-gradient(135deg,#ffffff_0%,#f5f9fd_55%,#edf4fb_100%)] p-6 shadow-[0_24px_70px_-48px_rgba(57,91,124,0.28)] md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5B9BD5]">
                        Renivet Corporate
                    </p>
                    <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-900 md:text-5xl">
                        Corporate catalog, RFQs, quotes, and managed procurement
                    </h1>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                        This is the new corporate command surface for buyers. Start with
                        the catalog, request a custom quote, or continue into your RFQs,
                        quotes, and orders.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <a
                            href="/corporate/request-quote"
                            className="rounded-full bg-[#5B9BD5] px-5 py-3 text-sm font-semibold text-white"
                        >
                            Request Custom Quote
                        </a>
                        <a
                            href="/profile/corporate"
                            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                        >
                            Open Corporate Dashboard
                        </a>
                        <a
                            href="/corporate-orders"
                            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                        >
                            Legacy Self-Service Flow
                        </a>
                    </div>
                    {profile ? (
                        <div className="mt-6 rounded-2xl border border-white/80 bg-white/80 p-4 text-sm text-slate-600">
                            Active corporate profile: <span className="font-semibold text-slate-900">{profile.companyName}</span>
                        </div>
                    ) : null}
                </section>

                <section className="space-y-4">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="font-serif text-2xl font-semibold text-slate-900">
                                Corporate Catalog
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Catalog records are mapped to your marketplace products and tuned for B2B procurement.
                            </p>
                        </div>
                        <div className="text-sm text-slate-500">{catalog.total} items</div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {catalog.data.length ? (
                            catalog.data.map((item) => (
                                <article
                                    key={item.id}
                                    className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f7750]">
                                        {item.brand.name}
                                    </p>
                                    <h3 className="mt-2 text-xl font-semibold text-slate-900">
                                        {item.corporateTitle}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {item.corporateDescription}
                                    </p>
                                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-2xl bg-slate-50 px-3 py-3">
                                            <div className="text-slate-500">MOQ</div>
                                            <div className="font-semibold text-slate-900">{item.moq}</div>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 px-3 py-3">
                                            <div className="text-slate-500">Lead Time</div>
                                            <div className="font-semibold text-slate-900">{item.leadTimeDays} days</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {item.availableSizes.slice(0, 4).map((size) => (
                                            <span
                                                key={size}
                                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                                            >
                                                {size}
                                            </span>
                                        ))}
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                                The corporate catalog has not been seeded yet. An admin can populate it from existing marketplace products from the corporate command center.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </GeneralShell>
    );
}
