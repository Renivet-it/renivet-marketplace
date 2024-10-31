import { env } from "@/../env";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { AppError, CResponse, handleError } from "@/lib/utils";
import {
    CachedUser,
    Profile,
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

                    const user: User = {
                        id: webhookUser.id,
                        firstName: webhookUser.first_name,
                        lastName: webhookUser.last_name,
                        email: webhookUser.email_addresses[0].email_address,
                        avatarUrl: webhookUser.image_url,
                        isVerified:
                            webhookUser.email_addresses[0].verification
                                .status === "verified",
                        createdAt: webhookUser.created_at,
                        updatedAt: webhookUser.updated_at,
                    };

                    const profile: Omit<
                        Profile,
                        "id" | "phone" | "address" | "isProfileCompleted"
                    > = {
                        userId: user.id,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                    };

                    const cachedUser: CachedUser = {
                        ...user,
                        isVerified:
                            webhookUser.email_addresses[0].verification
                                .status === "verified",
                        profile: {
                            ...profile,
                            address: null,
                            isProfileCompleted: false,
                            phone: null,
                        },
                        roles: [],
                    };

                    await db.insert(users).values(user);

                    await Promise.all([
                        db.insert(profiles).values(profile),
                        userCache.add(cachedUser),
                    ]);
                }
                break;

            case "user.updated":
                {
                    const webhookUser = userWebhookSchema.parse(data);

                    const user: User = {
                        id: webhookUser.id,
                        firstName: webhookUser.first_name,
                        lastName: webhookUser.last_name,
                        email: webhookUser.email_addresses[0].email_address,
                        avatarUrl: webhookUser.image_url,
                        isVerified:
                            webhookUser.email_addresses[0].verification
                                .status === "verified",
                        createdAt: webhookUser.created_at,
                        updatedAt: webhookUser.updated_at,
                    };

                    const existingCachedUser = await userCache.get(user.id);
                    if (!existingCachedUser)
                        throw new AppError("User not found", "NOT_FOUND");

                    const cachedUser: CachedUser = {
                        ...user,
                        isVerified:
                            webhookUser.email_addresses[0].verification
                                .status === "verified",
                        profile: existingCachedUser.profile,
                        roles: existingCachedUser.roles,
                    };

                    await Promise.all([
                        db
                            .update(users)
                            .set({
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                avatarUrl: user.avatarUrl,
                                isVerified: user.isVerified,
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
        console.error(err);
        return handleError(err);
    }
}
