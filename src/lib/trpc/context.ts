import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { CachedUser, UserWithProfile } from "@/lib/validations";
import {
    SignedInAuthObject,
    SignedOutAuthObject,
} from "@clerk/backend/internal";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

type ContextProps = {
    req: NextRequest | Request;
    auth: SignedInAuthObject | SignedOutAuthObject | null;
    user: UserWithProfile | null;
};

export const createContextInner = ({ req, auth, user }: ContextProps) => {
    return {
        db,
        req,
        auth,
        user,
        schemas: schema,
    };
};

export const createContext = async ({
    req,
}: FetchCreateContextFnOptions & {
    req: NextRequest | Request;
}) => {
    let user: UserWithProfile | null = null;

    const auth = await clerkAuth();

    if (auth.userId) {
        const cachedUser = await userCache.get(auth.userId);

        if (cachedUser) user = cachedUser;
        else {
            const dbUser = await db.query.users.findFirst({
                where: eq(schema.users.id, auth.userId),
                with: {
                    profile: true,
                    roles: {
                        with: {
                            role: true,
                        },
                    },
                },
            });

            if (dbUser && dbUser.profile) {
                user = {
                    ...dbUser,
                    profile: dbUser.profile,
                    roles: dbUser.roles.map((r) => r.role),
                };

                const cachedUser: CachedUser = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    profile: {
                        address: user.profile.address,
                        phone: user.profile.phone,
                        isProfileCompleted: user.profile.isProfileCompleted,
                    },
                    roles: user.roles,
                    isVerified: user.isVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                };

                await userCache.add(cachedUser);
            }
        }
    }

    return createContextInner({
        req,
        auth,
        user,
    });
};

export type Context = ReturnType<typeof createContextInner>;
