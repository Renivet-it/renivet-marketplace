import { env } from "@/../env";
import { db } from "@/lib/db";
import { accountMergeIntents, addresses, carts, orders, ordersIntent, wishlists } from "@/lib/db/schema";
import { resend } from "@/lib/resend";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createHash, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({ action: z.enum(["start", "confirm"]), email: z.string().email().optional(), intentId: z.string().uuid().optional(), code: z.string().length(6).optional() });
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const input = requestSchema.parse(await request.json());
    const client = await clerkClient();

    if (input.action === "start") {
        const email = input.email!.trim().toLowerCase();
        const matches = await client.users.getUserList({ emailAddress: [email], limit: 2 });
        const target = matches.data.find(
            (item) =>
                item.id !== userId &&
                item.emailAddresses.some(
                    (address) =>
                        address.emailAddress.toLowerCase() === email &&
                        address.verification?.status === "verified"
                )
        );
        if (!target) return NextResponse.json({ exists: false });
        const code = randomInt(100000, 1000000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const [intent] = await db.insert(accountMergeIntents).values({ sourceUserId: userId, targetUserId: target.id, targetEmail: email, verificationCodeHash: hash(code), expiresAt }).returning();
        await resend.emails.send({ from: env.RESEND_EMAIL_FROM, to: email, subject: "Verify your Renivet account merge", text: `Your Renivet account merge code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.` });
        return NextResponse.json({ exists: true, intentId: intent.id });
    }

    const intent = await db.query.accountMergeIntents.findFirst({ where: and(eq(accountMergeIntents.id, input.intentId!), eq(accountMergeIntents.sourceUserId, userId)) });
    if (!intent || intent.status !== "pending" || intent.expiresAt < new Date()) return NextResponse.json({ error: "This merge request has expired. Start again." }, { status: 400 });
    if (intent.verificationCodeHash !== hash(input.code!)) return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });

    const [source, target] = await Promise.all([client.users.getUser(intent.sourceUserId), client.users.getUser(intent.targetUserId)]);
    const phone = source.primaryPhoneNumber;
    if (!phone || phone.verification?.status !== "verified") return NextResponse.json({ error: "Your phone must be verified before accounts can be combined." }, { status: 400 });

    let phoneRemoved = false;
    try {
        await client.users.lockUser(source.id);
        await client.phoneNumbers.deletePhoneNumber(phone.id);
        phoneRemoved = true;
        await client.phoneNumbers.createPhoneNumber({ userId: target.id, phoneNumber: phone.phoneNumber, verified: true, primary: !target.primaryPhoneNumber });
        await db.transaction(async (tx) => {
            await Promise.all([
                tx.update(orders).set({ userId: target.id, updatedAt: new Date() }).where(eq(orders.userId, source.id)),
                tx.update(addresses).set({ userId: target.id, updatedAt: new Date() }).where(eq(addresses.userId, source.id)),
                tx.update(carts).set({ userId: target.id, updatedAt: new Date() }).where(eq(carts.userId, source.id)),
                tx.update(wishlists).set({ userId: target.id, updatedAt: new Date() }).where(eq(wishlists.userId, source.id)),
                tx.update(ordersIntent).set({ userId: target.id, updatedAt: new Date() }).where(eq(ordersIntent.userId, source.id)),
            ]);
            await tx.update(accountMergeIntents).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() }).where(eq(accountMergeIntents.id, intent.id));
        });
        await client.users.deleteUser(source.id);
        const ticket = await client.signInTokens.createSignInToken({ userId: target.id, expiresInSeconds: 60 });
        return NextResponse.json({ completed: true, ticket: ticket.token });
    } catch (error) {
        if (phoneRemoved) {
            try { await client.phoneNumbers.createPhoneNumber({ userId: source.id, phoneNumber: phone.phoneNumber, verified: true, primary: true }); } catch {}
        }
        try { await client.users.unlockUser(source.id); } catch {}
        await db.update(accountMergeIntents).set({ status: "failed", error: error instanceof Error ? error.message : "Unknown merge failure", updatedAt: new Date() }).where(eq(accountMergeIntents.id, intent.id));
        return NextResponse.json({ error: "We could not combine the accounts. Nothing was deleted; please try again." }, { status: 500 });
    }
}
