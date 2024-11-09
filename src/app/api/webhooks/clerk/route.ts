import { env } from "@/../env";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { AppError, CResponse, handleError } from "@/lib/utils";
import {
    CachedUser,
    User,
    userDeleteWebhookSchema,
    userWebhookSchema,
    webhookSchema,
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

        const { type, data } = webhookSchema.parse(
            wh.verify(JSON.stringify(payload), headers)
        );

        switch (type) {
            case "user.created":
                {
                    const webhookUser = userWebhookSchema.parse(data);

                    const email = webhookUser.email_addresses.find(
                        (e) => e.id === webhookUser.primary_email_address_id
                    )!;
                    const phone = webhookUser.phone_numbers.find(
                        (p) => p?.id === webhookUser.primary_phone_number_id
                    );

                    const user: User = {
                        id: webhookUser.id,
                        firstName: webhookUser.first_name,
                        lastName: webhookUser.last_name,
                        email: email.email_address,
                        phone: phone?.phone_number ?? null,
                        avatarUrl: webhookUser.image_url,
                        isEmailVerified:
                            email.verification?.status === "verified",
                        isPhoneVerified:
                            phone?.verification?.status === "verified",
                        createdAt: webhookUser.created_at,
                        updatedAt: webhookUser.updated_at,
                    };

                    const cachedUser: CachedUser = {
                        ...user,
                        isEmailVerified:
                            email.verification?.status === "verified",
                        isPhoneVerified:
                            phone?.verification?.status === "verified",
                        addresses: [],
                        roles: [],
                    };

                    await Promise.all([
                        db.insert(users).values(user),
                        userCache.add(cachedUser),
                    ]);
                }
                break;

            case "user.updated":
                {
                    const webhookUser = userWebhookSchema.parse(data);

                    const email = webhookUser.email_addresses.find(
                        (e) => e.id === webhookUser.primary_email_address_id
                    )!;
                    const phone = webhookUser.phone_numbers.find(
                        (p) => p?.id === webhookUser.primary_phone_number_id
                    );

                    const user: User = {
                        id: webhookUser.id,
                        firstName: webhookUser.first_name,
                        lastName: webhookUser.last_name,
                        email: email.email_address,
                        phone: phone?.phone_number ?? null,
                        avatarUrl: webhookUser.image_url,
                        isEmailVerified:
                            email.verification?.status === "verified",
                        isPhoneVerified:
                            phone?.verification?.status === "verified",
                        createdAt: webhookUser.created_at,
                        updatedAt: webhookUser.updated_at,
                    };

                    const existingCachedUser = await userCache.get(user.id);
                    if (!existingCachedUser)
                        throw new AppError("User not found", "NOT_FOUND");

                    const cachedUser: CachedUser = {
                        ...user,
                        isEmailVerified:
                            email.verification?.status === "verified",
                        isPhoneVerified:
                            phone?.verification?.status === "verified",
                        roles: existingCachedUser.roles,
                        addresses: existingCachedUser.addresses,
                    };

                    await Promise.all([
                        db
                            .update(users)
                            .set({
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                phone: user.phone,
                                avatarUrl: user.avatarUrl,
                                isEmailVerified: user.isEmailVerified,
                                isPhoneVerified: user.isPhoneVerified,
                                updatedAt: user.updatedAt,
                            })
                            .where(eq(users.id, user.id)),
                        userCache.update(cachedUser),
                    ]);
                }
                break;

            case "user.deleted":
                {
                    const { id } = userDeleteWebhookSchema.parse(data);

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
