import { TicketPage } from "@/components/profile";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { userSupportTickets } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Support Ticket",
    description: "View and respond to your support ticket",
};

interface PageProps {
    params: Promise<{ ticketId: string }>;
}

export default function Page({ params }: PageProps) {
    return (
        <div className="min-w-0 flex-1">
            <Suspense fallback={<TicketSkeleton />}>
                <TicketFetch params={params} />
            </Suspense>
        </div>
    );
}

async function TicketFetch({ params }: PageProps) {
    const { ticketId } = await params;

    const { userId } = await auth();
    if (!userId) redirect("/auth/signin");

    const user = await userCache.get(userId);
    if (!user) redirect("/auth/signin");

    const ticket = await db.query.userSupportTickets.findFirst({
        where: eq(userSupportTickets.id, ticketId),
    });

    if (!ticket || ticket.userId !== user.id) {
        redirect("/profile/help-center");
    }

    return <TicketPage initialTicket={ticket} />;
}

function TicketSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
        </div>
    );
}
