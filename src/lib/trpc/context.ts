import { db } from "@/lib/db";
import {
    bannedBrandMemberQueries,
    bannerQueries,
    blogQueries,
    brandInviteQueries,
    brandMemberQueries,
    brandQueries,
    brandRequestQueries,
    roleQueries,
    subscriberQueries,
    tagQueries,
    ticketQueries,
    userQueries,
    waitlistQueries,
} from "@/lib/db/queries";
import * as schema from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { UserWithAddressesRolesAndBrand } from "@/lib/validations";
import {
    SignedInAuthObject,
    SignedOutAuthObject,
} from "@clerk/backend/internal";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";

type ContextProps = {
    req: NextRequest | Request;
    auth: SignedInAuthObject | SignedOutAuthObject | null;
    user: UserWithAddressesRolesAndBrand | null;
};

export const createContextInner = ({ req, auth, user }: ContextProps) => {
    return {
        db,
        req,
        auth,
        user,
        schemas: schema,
        queries: {
            bannedBrandMembers: bannedBrandMemberQueries,
            banners: bannerQueries,
            blogs: blogQueries,
            brandInvites: brandInviteQueries,
            brandMembers: brandMemberQueries,
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
    let user: UserWithAddressesRolesAndBrand | null = null;

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
