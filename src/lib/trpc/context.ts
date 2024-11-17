import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { UserWithAddressesAndRoles } from "@/lib/validations";
import {
    SignedInAuthObject,
    SignedOutAuthObject,
} from "@clerk/backend/internal";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";
import {
    bannerQueries,
    blogQueries,
    brandQueries,
    brandRequestQueries,
    roleQueries,
    subscriberQueries,
    tagQueries,
    ticketQueries,
    userQueries,
    waitlistQueries,
} from "../db/queries";

type ContextProps = {
    req: NextRequest | Request;
    auth: SignedInAuthObject | SignedOutAuthObject | null;
    user: UserWithAddressesAndRoles | null;
};

export const createContextInner = ({ req, auth, user }: ContextProps) => {
    return {
        db,
        req,
        auth,
        user,
        schemas: schema,
        queries: {
            banners: bannerQueries,
            blogs: blogQueries,
            brands: brandQueries,
            brandRequests: brandRequestQueries,
            roles: roleQueries,
            newsletterSubscribers: subscriberQueries,
            tags: tagQueries,
            tickets: ticketQueries,
            users: userQueries,
            waitlists: waitlistQueries,
        },
    };
};

export const createContext = async ({
    req,
}: FetchCreateContextFnOptions & {
    req: NextRequest | Request;
}) => {
    let user: UserWithAddressesAndRoles | null = null;

    const auth = await clerkAuth();

    if (auth.userId) {
        const cachedUser = await userCache.get(auth.userId);
        if (cachedUser) user = cachedUser;
    }

    return createContextInner({
        req,
        auth,
        user,
    });
};

export type Context = ReturnType<typeof createContextInner>;
