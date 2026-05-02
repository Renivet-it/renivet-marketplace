import { env } from "@/../env";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { posthog } from "@/lib/posthog/client";
import { first100Cache, userCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import { AccountCreated } from "@/lib/resend/emails";
import { CResponse, handleError } from "@/lib/utils";
import {
    clerkWebhookSchema,
    userDeleteWebhookSchema,
    userWebhookSchema,
} from "@/lib/validations";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { Webhook } from "svix";

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        const headers: SvixHeaders = {
            "svix-id": req.headers.get("svix-id")!,
            "svix-timestamp": req.headers.get("svix-timestamp")!,
            "svix-signature": req.headers.get("svix-signature")!,
        };

        const wh = new Webhook(env.SVIX_SECRET);

        const { type, data } = clerkWebhookSchema.parse(
            wh.verify(JSON.stringify(payload), headers)
        );

        switch (type) {
            case "user.created":
                {
                    const webhookUser = userWebhookSchema.parse(data);

                    const email = webhookUser.email_addresses.find(
                        (e) => e.id === webhookUser.primary_email_address_id
                    );
                    const phone = webhookUser.phone_numbers.find(
                        (p) => p?.id === webhookUser.primary_phone_number_id
                    );
                    const firstName = webhookUser.first_name ?? "Renivet";
                    const lastName = webhookUser.last_name ?? "Customer";

                    posthog.capture({
                        distinctId: webhookUser.id,
                        event: POSTHOG_EVENTS.USER.ACCOUNT.CREATED,
                        properties: {
                            email: email?.email_address ?? null,
                            isEmailVerified:
                                email?.verification?.status === "verified",
                            firstName,
                            lastName,
                            phone: phone?.phone_number ?? null,
                        },
                    });

                    const newUser = await db
                        .insert(users)
                        .values({
                            id: webhookUser.id,
                            firstName,
                            lastName,
                            email: email?.email_address ?? null,
                            phone: phone?.phone_number ?? null,
                            avatarUrl: webhookUser.image_url,
                            isEmailVerified:
                                email?.verification?.status === "verified",
                            isPhoneVerified:
                                phone?.verification?.status === "verified",
                            createdAt: webhookUser.created_at,
                            updatedAt: webhookUser.updated_at,
                        })
                        .onConflictDoUpdate({
                            target: users.id,
                            set: {
                                firstName,
                                lastName,
                                email: email?.email_address ?? null,
                                phone: phone?.phone_number ?? null,
                                avatarUrl: webhookUser.image_url,
                                isEmailVerified:
                                    email?.verification?.status === "verified",
                                isPhoneVerified:
                                    phone?.verification?.status === "verified",
                                updatedAt: webhookUser.updated_at,
                            },
                        })
                        .returning()
                        .then((res) => res[0]);

                    await userCache.remove(webhookUser.id);

                    let addCode = false;

                    const currentFirst100Cache = await first100Cache.get();
                    if (currentFirst100Cache < 100) {
                        await first100Cache.set();
                        addCode = true;
                    }

                    if (newUser.email) {
                        await resend.emails.send({
                            from: env.RESEND_EMAIL_FROM,
                            to: newUser.email,
                            subject:
                                "🎉 Welcome Aboard the Renivet Express! 🎉",
                            react: AccountCreated({ user: newUser, addCode }),
                        });
                    }
                }
                break;

            case "user.updated":
                {
                    const webhookUser = userWebhookSchema.parse(data);

                    const email = webhookUser.email_addresses.find(
                        (e) => e.id === webhookUser.primary_email_address_id
                    );
                    const phone = webhookUser.phone_numbers.find(
                        (p) => p?.id === webhookUser.primary_phone_number_id
                    );
                    const firstName = webhookUser.first_name ?? "Renivet";
                    const lastName = webhookUser.last_name ?? "Customer";

                    posthog.capture({
                        distinctId: webhookUser.id,
                        event: POSTHOG_EVENTS.USER.ACCOUNT.UPDATED,
                        properties: {
                            email: email?.email_address ?? null,
                            isEmailVerified:
                                email?.verification?.status === "verified",
                            firstName,
                            lastName,
                            phone: phone?.phone_number ?? null,
                        },
                    });

                    await Promise.all([
                        db
                            .insert(users)
                            .values({
                                id: webhookUser.id,
                                firstName,
                                lastName,
                                email: email?.email_address ?? null,
                                phone: phone?.phone_number ?? null,
                                avatarUrl: webhookUser.image_url,
                                isEmailVerified:
                                    email?.verification?.status === "verified",
                                isPhoneVerified:
                                    phone?.verification?.status === "verified",
                                createdAt: webhookUser.created_at,
                                updatedAt: webhookUser.updated_at,
                            })
                            .onConflictDoUpdate({
                                target: users.id,
                                set: {
                                    firstName,
                                    lastName,
                                    email: email?.email_address ?? null,
                                    phone: phone?.phone_number ?? null,
                                    avatarUrl: webhookUser.image_url,
                                    isEmailVerified:
                                        email?.verification?.status ===
                                        "verified",
                                    isPhoneVerified:
                                        phone?.verification?.status ===
                                        "verified",
                                    updatedAt: webhookUser.updated_at,
                                },
                            }),
                        userCache.remove(webhookUser.id),
                    ]);
                }
                break;

            case "user.deleted":
                {
                    const { id } = userDeleteWebhookSchema.parse(data);

                    posthog.capture({
                        distinctId: id,
                        event: POSTHOG_EVENTS.USER.ACCOUNT.DELETED,
                    });

                    await Promise.all([
                        db.delete(users).where(eq(users.id, id)),
                        userCache.remove(id),
                    ]);
                }
                break;
        }

        return CResponse({
            message: "OK",
        });
    } catch (err) {
        return handleError(err);
    }
}
