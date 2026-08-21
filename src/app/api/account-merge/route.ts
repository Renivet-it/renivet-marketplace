import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { env } from "@/../env";
import { db } from "@/lib/db";
import { accountMergeIntents } from "@/lib/db/schema";
import { resend } from "@/lib/resend";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MAX_ATTEMPTS = 5;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const CLERK_LOOKUP_TIMEOUT_MS = 8 * 1000;
const RENIVET_LOGO_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNul0Kj0hnjfTvXWe4YdlSzoaZPyC7xGVghIDL";

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            operation,
            new Promise<T>((_, reject) => {
                timeout = setTimeout(
                    () => reject(new Error("Clerk lookup timed out")),
                    timeoutMs
                );
            }),
        ]);
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

const requestSchema = z.discriminatedUnion("action", [
    z.object({ action: z.literal("start"), email: z.string().trim().email() }),
    z.object({ action: z.literal("consent"), intentId: z.string().uuid() }),
    z.object({ action: z.literal("cancel"), intentId: z.string().uuid() }),
    z.object({ action: z.literal("cleanup"), intentId: z.string().uuid() }),
    z.object({
        action: z.literal("confirm"),
        intentId: z.string().uuid(),
        code: z
            .string()
            .regex(
                /^\d{6}$/,
                "Enter the complete six-digit verification code."
            ),
    }),
]);

const otpHash = (intentId: string, code: string) =>
    createHmac("sha256", env.JWT_SECRET_KEY)
        .update(`${intentId}:${code}`)
        .digest("hex");

const issuedOtpHash = (intentId: string, code: string, issuedAt: number) =>
    `${issuedAt}:${otpHash(intentId, code)}`;

const storedOtp = (value: string) => {
    const separator = value.indexOf(":");
    if (separator === -1) return { hash: value, issuedAt: null };

    const issuedAt = Number(value.slice(0, separator));
    return {
        hash: value.slice(separator + 1),
        issuedAt: Number.isSafeInteger(issuedAt) ? issuedAt : null,
    };
};

const safeEqual = (left: string, right: string) => {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");
    return (
        leftBuffer.length === rightBuffer.length &&
        timingSafeEqual(leftBuffer, rightBuffer)
    );
};

const jsonError = (error: string, status: number) =>
    NextResponse.json({ error }, { status });

const accountMergeEmailHtml = (code: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Verify your Renivet account</title>
  </head>
  <body style="margin:0;background:#f3f4ef;font-family:Arial,Helvetica,sans-serif;color:#171b14;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Use ${code} to securely combine your Renivet accounts. The code expires in 10 minutes.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4ef;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e1e4dc;border-radius:22px;overflow:hidden;box-shadow:0 12px 32px rgba(35,44,27,0.08);">
            <tr>
              <td style="background:#ffffff;padding:20px 32px;border-bottom:1px solid #e8eae3;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="left" valign="middle">
                      <img src="${RENIVET_LOGO_URL}" width="158" alt="Renivet" style="display:block;width:158px;max-width:100%;height:auto;border:0;" />
                    </td>
                    <td align="right" valign="middle" style="padding-left:16px;font-size:11px;font-weight:700;letter-spacing:1.4px;color:#56604b;white-space:nowrap;">SECURE VERIFICATION</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 18px;">
                <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;color:#6f765f;">ACCOUNT SYNC</div>
                <h1 style="margin:10px 0 12px;font-size:28px;line-height:1.25;font-weight:600;color:#171b14;">Confirm it’s really you</h1>
                <p style="margin:0;font-size:16px;line-height:1.6;color:#62675d;">Enter this verification code in Renivet to securely combine your accounts and bring your details together.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 32px 24px;">
                <div style="border:1px solid #dfe3d8;border-radius:16px;background:#f8f9f5;padding:24px 18px;text-align:center;">
                  <div style="font-size:12px;font-weight:700;letter-spacing:1.4px;color:#747b69;">YOUR VERIFICATION CODE</div>
                  <div style="margin-top:12px;font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:9px;color:#27301f;">${code}</div>
                  <div style="margin-top:13px;font-size:13px;color:#7a8074;">Valid for 10 minutes</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 36px;">
                <p style="margin:0;padding:16px 18px;border-radius:12px;background:#f5f1e7;font-size:13px;line-height:1.55;color:#686459;">For your security, never share this code. If you didn’t request an account sync, you can safely ignore this email—no changes will be made.</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #eceee8;padding:20px 32px;text-align:center;font-size:12px;color:#888d82;">Renivet &nbsp;•&nbsp; Shop consciously. Live beautifully.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

async function migrateAccountData(sourceUserId: string, targetUserId: string) {
    await db.transaction(async (tx) => {
        const users = await tx.execute(sql`
            SELECT id FROM users WHERE id IN (${sourceUserId}, ${targetUserId}) FOR UPDATE
        `);
        if (users.length !== 2) {
            throw new Error(
                "Both account records must exist before they can be combined."
            );
        }

        await tx.execute(sql`
            WITH source_phone AS (
                SELECT source.phone, source.is_phone_verified
                FROM users source
                WHERE source.id = ${sourceUserId}
                FOR UPDATE
            ), moved_phone AS (
                UPDATE users source
                SET phone = NULL, updated_at = NOW()
                FROM source_phone
                WHERE source.id = ${sourceUserId}
                  AND EXISTS (
                      SELECT 1 FROM users target
                      WHERE target.id = ${targetUserId} AND target.phone IS NULL
                  )
                RETURNING source_phone.phone, source_phone.is_phone_verified
            )
            UPDATE users target
            SET phone = moved_phone.phone,
                is_phone_verified = target.is_phone_verified OR moved_phone.is_phone_verified,
                updated_at = NOW()
            FROM moved_phone
            WHERE target.id = ${targetUserId}
        `);

        const offsetRows = await tx.execute(sql`
            SELECT COALESCE(MAX(reward_cycle), 0)::integer AS offset
            FROM reward_redemptions
            WHERE user_id = ${targetUserId}
        `);
        const rewardCycleOffset = Number(offsetRows[0]?.offset ?? 0);

        await tx.execute(sql`
            DELETE FROM wishlists source
            USING wishlists target
            WHERE source.user_id = ${sourceUserId}
              AND target.user_id = ${targetUserId}
              AND source.product_id = target.product_id
        `);

        await tx.execute(sql`
            UPDATE orders
            SET user_id = ${targetUserId},
                swap_reward_cycle = CASE
                    WHEN swap_reward_cycle IS NULL THEN NULL
                    ELSE swap_reward_cycle + ${rewardCycleOffset}
                END,
                updated_at = NOW()
            WHERE user_id = ${sourceUserId}
        `);
        await tx.execute(
            sql`UPDATE addresses SET user_id = ${targetUserId}, updated_at = NOW() WHERE user_id = ${sourceUserId}`
        );
        await tx.execute(
            sql`UPDATE carts SET user_id = ${targetUserId}, updated_at = NOW() WHERE user_id = ${sourceUserId}`
        );
        await tx.execute(
            sql`UPDATE wishlists SET user_id = ${targetUserId}, updated_at = NOW() WHERE user_id = ${sourceUserId}`
        );
        await tx.execute(
            sql`UPDATE orders_intent SET user_id = ${targetUserId}, updated_at = NOW() WHERE user_id = ${sourceUserId}`
        );

        await tx.execute(sql`
            UPDATE swap_reward_events
            SET user_id = ${targetUserId},
                reward_cycle = reward_cycle + ${rewardCycleOffset},
                updated_at = NOW()
            WHERE user_id = ${sourceUserId}
        `);
        await tx.execute(sql`
            UPDATE reward_redemptions
            SET user_id = ${targetUserId},
                reward_cycle = reward_cycle + ${rewardCycleOffset},
                updated_at = NOW()
            WHERE user_id = ${sourceUserId}
        `);
        await tx.execute(sql`
            INSERT INTO user_swap_rewards (
                user_id, total_stamp_count, current_cycle_stamp_count,
                reward_status, unlocked_at, redeemed_at, total_rewards_earned,
                active_reward_cycle, last_stamp_order_id, created_at, updated_at
            )
            SELECT
                ${targetUserId}, total_stamp_count, current_cycle_stamp_count,
                reward_status, unlocked_at, redeemed_at, total_rewards_earned,
                active_reward_cycle + ${rewardCycleOffset}, last_stamp_order_id,
                created_at, NOW()
            FROM user_swap_rewards
            WHERE user_id = ${sourceUserId}
            ON CONFLICT (user_id) DO UPDATE SET
                total_stamp_count = user_swap_rewards.total_stamp_count + EXCLUDED.total_stamp_count,
                current_cycle_stamp_count = user_swap_rewards.current_cycle_stamp_count + EXCLUDED.current_cycle_stamp_count,
                total_rewards_earned = user_swap_rewards.total_rewards_earned + EXCLUDED.total_rewards_earned,
                active_reward_cycle = GREATEST(user_swap_rewards.active_reward_cycle, EXCLUDED.active_reward_cycle),
                reward_status = CASE
                    WHEN user_swap_rewards.reward_status = 'unlocked' OR EXCLUDED.reward_status = 'unlocked' THEN 'unlocked'
                    WHEN user_swap_rewards.reward_status = 'redeemed' AND EXCLUDED.reward_status = 'redeemed' THEN 'redeemed'
                    ELSE 'locked'
                END,
                unlocked_at = COALESCE(user_swap_rewards.unlocked_at, EXCLUDED.unlocked_at),
                redeemed_at = COALESCE(user_swap_rewards.redeemed_at, EXCLUDED.redeemed_at),
                last_stamp_order_id = COALESCE(EXCLUDED.last_stamp_order_id, user_swap_rewards.last_stamp_order_id),
                updated_at = NOW()
        `);
        await tx.execute(
            sql`DELETE FROM user_swap_rewards WHERE user_id = ${sourceUserId}`
        );
    });
}

export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) return jsonError("Unauthorized", 401);

    const parsed = requestSchema.safeParse(
        await request.json().catch(() => null)
    );
    if (!parsed.success) {
        const codeIssue = parsed.error.issues.find(
            (issue) => issue.path.at(-1) === "code"
        );
        return jsonError(
            codeIssue?.message ?? "Invalid account merge request.",
            400
        );
    }

    const input = parsed.data;
    const client = await clerkClient();

    if (input.action === "start") {
        const email = input.email.toLowerCase();
        let matches;
        try {
            matches = await withTimeout(
                client.users.getUserList({
                    emailAddress: [email],
                    limit: 2,
                }),
                CLERK_LOOKUP_TIMEOUT_MS
            );
        } catch {
            return jsonError(
                "We could not check this email right now. Please try again.",
                503
            );
        }
        const target = matches.data.find((item) => item.id !== userId);
        if (!target) return NextResponse.json({ exists: false });

        const existing = await db.query.accountMergeIntents.findFirst({
            where: and(
                eq(accountMergeIntents.sourceUserId, userId),
                eq(accountMergeIntents.targetUserId, target.id),
                eq(accountMergeIntents.status, "awaiting_consent"),
                gt(accountMergeIntents.expiresAt, new Date())
            ),
        });
        if (existing) {
            return NextResponse.json({ exists: true, intentId: existing.id });
        }

        await db
            .update(accountMergeIntents)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(
                and(
                    eq(accountMergeIntents.sourceUserId, userId),
                    inArray(accountMergeIntents.status, [
                        "awaiting_consent",
                        "pending",
                    ])
                )
            );

        const [intent] = await db
            .insert(accountMergeIntents)
            .values({
                sourceUserId: userId,
                targetUserId: target.id,
                targetEmail: email,
                verificationCodeHash: randomBytes(32).toString("hex"),
                status: "awaiting_consent",
                expiresAt: new Date(Date.now() + OTP_TTL_MS),
            })
            .returning();
        return NextResponse.json({ exists: true, intentId: intent.id });
    }

    if (input.action === "cancel") {
        await db
            .update(accountMergeIntents)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(
                and(
                    eq(accountMergeIntents.id, input.intentId),
                    eq(accountMergeIntents.sourceUserId, userId),
                    inArray(accountMergeIntents.status, [
                        "awaiting_consent",
                        "pending",
                    ])
                )
            );
        return NextResponse.json({ cancelled: true });
    }

    if (input.action === "consent") {
        const intent = await db.query.accountMergeIntents.findFirst({
            where: and(
                eq(accountMergeIntents.id, input.intentId),
                eq(accountMergeIntents.sourceUserId, userId)
            ),
        });
        if (
            !intent ||
            !["awaiting_consent", "pending"].includes(intent.status)
        ) {
            return jsonError("This merge request is no longer available.", 400);
        }
        if (
            intent.lastCodeSentAt &&
            intent.lastCodeSentAt.getTime() > Date.now() - RESEND_COOLDOWN_MS
        ) {
            return jsonError(
                "Please wait before requesting another code.",
                429
            );
        }

        const code = randomInt(100000, 1000000).toString();
        const now = new Date();
        const [updated] = await db
            .update(accountMergeIntents)
            .set({
                verificationCodeHash: issuedOtpHash(
                    intent.id,
                    code,
                    now.getTime()
                ),
                attempts: 0,
                status: "pending",
                consentedAt: intent.consentedAt ?? now,
                lastCodeSentAt: now,
                expiresAt: new Date(now.getTime() + OTP_TTL_MS),
                error: null,
                updatedAt: now,
            })
            .where(
                and(
                    eq(accountMergeIntents.id, intent.id),
                    eq(accountMergeIntents.sourceUserId, userId),
                    inArray(accountMergeIntents.status, [
                        "awaiting_consent",
                        "pending",
                    ])
                )
            )
            .returning();
        if (!updated)
            return jsonError("This merge request changed. Start again.", 409);

        try {
            const delivery = await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: intent.targetEmail,
                subject: "Verify your Renivet account merge",
                html: accountMergeEmailHtml(code),
                text: `Your Renivet account merge code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
            });
            if (delivery.error) throw new Error(delivery.error.message);
        } catch (error) {
            await db
                .update(accountMergeIntents)
                .set({
                    status: "awaiting_consent",
                    error:
                        error instanceof Error
                            ? error.message
                            : "Email delivery failed",
                    updatedAt: new Date(),
                })
                .where(eq(accountMergeIntents.id, intent.id));
            return jsonError(
                "The verification email could not be sent. Please try again.",
                502
            );
        }
        return NextResponse.json({ codeSent: true });
    }

    if (input.action === "cleanup") {
        const intent = await db.query.accountMergeIntents.findFirst({
            where: and(
                eq(accountMergeIntents.id, input.intentId),
                eq(accountMergeIntents.targetUserId, userId),
                eq(accountMergeIntents.status, "cleanup_required")
            ),
        });
        if (!intent) return jsonError("No account cleanup is pending.", 404);
        try {
            await client.users.deleteUser(intent.sourceUserId);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Cleanup failed";
            if (!message.toLowerCase().includes("not found")) {
                await db
                    .update(accountMergeIntents)
                    .set({ error: message, updatedAt: new Date() })
                    .where(eq(accountMergeIntents.id, intent.id));
                return jsonError(
                    "Account cleanup could not be completed yet.",
                    502
                );
            }
        }
        await db
            .update(accountMergeIntents)
            .set({
                status: "completed",
                sourceDeletedAt: new Date(),
                error: null,
                updatedAt: new Date(),
            })
            .where(eq(accountMergeIntents.id, intent.id));
        return NextResponse.json({ cleanedUp: true });
    }

    const intent = await db.query.accountMergeIntents.findFirst({
        where: and(
            eq(accountMergeIntents.id, input.intentId),
            eq(accountMergeIntents.sourceUserId, userId)
        ),
    });
    if (!intent) {
        return jsonError(
            "This merge request was not found for your current session. Start again.",
            404
        );
    }
    if (intent.status !== "pending") {
        return jsonError(
            "This merge request is no longer active. Request a new code.",
            409
        );
    }

    const savedOtp = storedOtp(intent.verificationCodeHash);
    const expiresAt = savedOtp.issuedAt
        ? savedOtp.issuedAt + OTP_TTL_MS
        : intent.expiresAt.getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        return jsonError("This merge request has expired. Start again.", 400);
    }
    if (intent.attempts >= MAX_ATTEMPTS) {
        return jsonError("Too many incorrect attempts. Start again.", 429);
    }

    const suppliedHash = otpHash(intent.id, input.code);
    if (!safeEqual(savedOtp.hash, suppliedHash)) {
        const [attemptResult] = await db
            .update(accountMergeIntents)
            .set({
                attempts: sql`${accountMergeIntents.attempts} + 1`,
                status: sql`CASE WHEN ${accountMergeIntents.attempts} + 1 >= ${MAX_ATTEMPTS} THEN 'locked' ELSE 'pending' END`,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(accountMergeIntents.id, intent.id),
                    eq(accountMergeIntents.status, "pending")
                )
            )
            .returning({ attempts: accountMergeIntents.attempts });
        const nextAttempts = attemptResult?.attempts ?? MAX_ATTEMPTS;
        return jsonError(
            nextAttempts >= MAX_ATTEMPTS
                ? "Too many incorrect attempts. Start again."
                : "Incorrect verification code.",
            nextAttempts >= MAX_ATTEMPTS ? 429 : 400
        );
    }

    const now = new Date();
    const [claimed] = await db
        .update(accountMergeIntents)
        .set({ status: "processing", processingStartedAt: now, updatedAt: now })
        .where(
            and(
                eq(accountMergeIntents.id, intent.id),
                eq(accountMergeIntents.sourceUserId, userId),
                eq(accountMergeIntents.status, "pending")
            )
        )
        .returning();
    if (!claimed)
        return jsonError("This merge is already being processed.", 409);

    let sourcePhoneRemoved = false;
    let temporarySourceEmailId: string | null = null;
    let targetPhoneId: string | null = null;
    let sourcePhoneNumber: string | null = null;
    let dataMigrated = false;
    let mergeStage = "load_accounts";

    try {
        const [source, target] = await Promise.all([
            client.users.getUser(claimed.sourceUserId),
            client.users.getUser(claimed.targetUserId),
        ]);
        const phone = source.primaryPhoneNumber;
        if (!phone || phone.verification?.status !== "verified") {
            throw new Error(
                "Your phone must be verified before accounts can be combined."
            );
        }
        sourcePhoneNumber = phone.phoneNumber;

        mergeStage = "create_sign_in_ticket";
        const ticket = await client.signInTokens.createSignInToken({
            userId: target.id,
            expiresInSeconds: 300,
        });

        // Clerk does not allow removing the only identifier from a user. A
        // phone-created account normally has no email, so keep it recoverable
        // with a short-lived internal identifier while its phone is moved.
        if (source.emailAddresses.length === 0) {
            mergeStage = "create_recovery_identifier";
            const temporaryEmail =
                await client.emailAddresses.createEmailAddress({
                    userId: source.id,
                    emailAddress: `merge-${claimed.id}@phone.renivet.com`,
                    verified: true,
                    primary: true,
                });
            temporarySourceEmailId = temporaryEmail.id;
        }

        mergeStage = "detach_phone";
        await client.phoneNumbers.deletePhoneNumber(phone.id);
        sourcePhoneRemoved = true;

        mergeStage = "attach_phone";
        const targetPhone = await client.phoneNumbers.createPhoneNumber({
            userId: target.id,
            phoneNumber: phone.phoneNumber,
            verified: true,
            primary: !target.primaryPhoneNumber,
        });
        targetPhoneId = targetPhone.id;

        mergeStage = "migrate_account_data";
        await migrateAccountData(source.id, target.id);
        dataMigrated = true;
        await db
            .update(accountMergeIntents)
            .set({ status: "data_migrated", updatedAt: new Date() })
            .where(eq(accountMergeIntents.id, claimed.id));

        try {
            mergeStage = "delete_source_account";
            await client.users.deleteUser(source.id);
            await db
                .update(accountMergeIntents)
                .set({
                    status: "completed",
                    completedAt: new Date(),
                    sourceDeletedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(accountMergeIntents.id, claimed.id));
            return NextResponse.json({ completed: true, ticket: ticket.token });
        } catch (deleteError) {
            await db
                .update(accountMergeIntents)
                .set({
                    status: "cleanup_required",
                    completedAt: new Date(),
                    error:
                        deleteError instanceof Error
                            ? deleteError.message
                            : "Account B deletion requires retry",
                    updatedAt: new Date(),
                })
                .where(eq(accountMergeIntents.id, claimed.id));
            return NextResponse.json({
                completed: true,
                cleanupPending: true,
                ticket: ticket.token,
            });
        }
    } catch (error) {
        console.error("Account merge failed", {
            intentId: claimed.id,
            stage: mergeStage,
            error,
        });
        if (!dataMigrated) {
            let recoveryFailed = false;
            if (targetPhoneId) {
                try {
                    await client.phoneNumbers.deletePhoneNumber(targetPhoneId);
                } catch {
                    recoveryFailed = true;
                }
            }
            if (sourcePhoneRemoved) {
                try {
                    if (sourcePhoneNumber) {
                        await client.phoneNumbers.createPhoneNumber({
                            userId: claimed.sourceUserId,
                            phoneNumber: sourcePhoneNumber,
                            verified: true,
                            primary: true,
                        });
                    }
                } catch {
                    recoveryFailed = true;
                }
            }
            if (temporarySourceEmailId) {
                try {
                    await client.emailAddresses.deleteEmailAddress(
                        temporarySourceEmailId
                    );
                } catch {
                    recoveryFailed = true;
                }
            }
            await db
                .update(accountMergeIntents)
                .set({
                    status: recoveryFailed ? "recovery_required" : "failed",
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown merge failure",
                    updatedAt: new Date(),
                })
                .where(eq(accountMergeIntents.id, claimed.id));
            return jsonError(
                recoveryFailed
                    ? "The merge was stopped safely, but phone recovery needs support assistance."
                    : `We could not combine the accounts during ${mergeStage.replaceAll("_", " ")}. No account data was moved.`,
                500
            );
        }
        await db
            .update(accountMergeIntents)
            .set({
                status: "cleanup_required",
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown merge failure",
                updatedAt: new Date(),
            })
            .where(eq(accountMergeIntents.id, claimed.id));
        return jsonError(
            "Your data was combined, but account cleanup needs support assistance.",
            500
        );
    }
}
