"use client";

import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { AlertCircle, ArrowRight, LifeBuoy, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function GrievancesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const claimToken = searchParams.get("claim");
    const claimedRef = useRef<string | null>(null);
    const claimMutation = trpc.general.legal.claimGuestGrievance.useMutation({
        onSuccess: (result) => {
            toast.success("Your grievance is now available in your account.");
            router.replace(`/profile/help-center/${result.ticketId}`);
        },
        onError: (error) => {
            toast.error(error.message);
            router.replace("/profile/grievances");
        },
    });

    useEffect(() => {
        if (
            claimToken &&
            claimedRef.current !== claimToken &&
            !claimMutation.isPending
        ) {
            claimedRef.current = claimToken;
            claimMutation.mutate({ token: claimToken });
        }
    }, [claimMutation, claimToken]);

    const grievancesQuery = trpc.general.userSupport.listMyGrievances.useQuery({
        limit: 50,
        page: 1,
    });

    if (claimToken || claimMutation.isPending) {
        return (
            <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="text-center">
                    <Loader2 className="mx-auto size-8 animate-spin text-[#4A84B8]" />
                    <p className="mt-4 text-sm text-slate-600">
                        Securing your grievance access…
                    </p>
                </div>
            </div>
        );
    }

    const grievances = grievancesQuery.data ?? [];

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-[#F7FBFF] to-[#EEF5FF] p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE3F8] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#4A84B8]">
                            <LifeBuoy className="size-3.5" />
                            Customer support
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                            My Grievances
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                            Track formal complaints, read replies, and continue the conversation with our support team.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/contact#grievance-redressal">Submit a grievance</Link>
                    </Button>
                </div>
            </section>

            {grievancesQuery.isError ? (
                <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                    <AlertCircle className="size-5 shrink-0" />
                    Unable to load your grievances right now. Please try again.
                </div>
            ) : grievances.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                    <LifeBuoy className="mx-auto size-10 text-slate-300" />
                    <h2 className="mt-4 text-lg font-semibold text-slate-900">No grievances yet</h2>
                    <p className="mt-2 text-sm text-slate-600">Your submitted grievances will appear here.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {grievances.map((grievance) => (
                        <Link
                            key={grievance.id}
                            href={`/profile/help-center/${grievance.id}`}
                            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#A9CDEB] hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                                        {grievance.issueLabel ?? "Grievance"}
                                    </p>
                                    <h2 className="mt-2 font-semibold text-slate-900">{grievance.title}</h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Submitted {format(new Date(grievance.createdAt), "dd MMM yyyy, hh:mm a")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-[#4A84B8]">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 capitalize text-slate-700">
                                        {grievance.status.replace(/_/g, " ")}
                                    </span>
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                            {grievance.orderId ? (
                                <p className="mt-4 text-xs text-slate-500">Order reference: {grievance.orderId}</p>
                            ) : null}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
