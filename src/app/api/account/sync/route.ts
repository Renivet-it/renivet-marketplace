import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clerkUser = await (await clerkClient()).users.getUser(userId);
    const email = clerkUser.primaryEmailAddress ?? clerkUser.emailAddresses[0];
    const phone = clerkUser.primaryPhoneNumber ?? clerkUser.phoneNumbers[0];
    const emailAddress =
        email?.emailAddress ??
        (phone?.phoneNumber
            ? `${phone.phoneNumber.replace(/[^0-9]/g, "")}@phone.renivet.com`
            : `${clerkUser.id}@renivet.com`);

    await db
        .update(users)
        .set({
            firstName: clerkUser.firstName || (phone ? "User" : "Customer"),
            lastName: clerkUser.lastName || "",
            email: emailAddress,
            phone: phone?.phoneNumber ?? null,
            avatarUrl: clerkUser.imageUrl ?? null,
            isEmailVerified: email?.verification?.status === "verified",
            isPhoneVerified: phone?.verification?.status === "verified",
            updatedAt: new Date(clerkUser.updatedAt),
        })
        .where(eq(users.id, userId));
    await userCache.remove(userId);

    return NextResponse.json({ synced: true });
}
