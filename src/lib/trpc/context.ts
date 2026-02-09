import { db } from "@/lib/db";
import {
    addressQueries,
    advertisementQueries,
    bannedBrandMemberQueries,
    bannerQueries,
    blogQueries,
    brandConfidentialQueries,
    brandInviteQueries,
    brandMediaItemQueries,
    brandMemberQueries,
    brandPageSection,
    brandPageSectionProduct,
    brandQueries,
    brandRequestQueries,
    brandSubscriptionQueries,
    categoryQueries,
    categoryRequestQueries,
    couponQueries,
    homeBrandProductQueries,
    homeShopByCategoryQueries,
    homeShopByCategoryTitleQueries,
    homeShopByNewCategoryQueries,
    legalQueries,
    marketingStripQueries,
    orderQueries,
    planQueries,
    productQueries,
    productTypeQueries,
    recommendationQueries,
    roleQueries,
    subCategoryQueries,
    subscriberQueries,
    tagQueries,
    ticketQueries,
    userCartQueries,
    userQueries,
    userWishlistQueries,
    waitlistQueries,
    WomenHomeSectionQueries,
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
            advertisements: advertisementQueries,
            bannedBrandMembers: bannedBrandMemberQueries,
            banners: bannerQueries,
            blogs: blogQueries,
            brandConfidentials: brandConfidentialQueries,
            brandInvites: brandInviteQueries,
            brandMediaItems: brandMediaItemQueries,
            brandMembers: brandMemberQueries,
            brandPageSections: brandPageSection,
            brandPageSectionProducts: brandPageSectionProduct,
            brands: brandQueries,
            brandRequests: brandRequestQueries,
            brandSubscriptions: brandSubscriptionQueries,
            categories: categoryQueries,
            categoryRequests: categoryRequestQueries,
            coupons: couponQueries,
            homeBrandProducts: homeBrandProductQueries,
            homeShopByCategories: homeShopByCategoryQueries,
            womenhomebanner: WomenHomeSectionQueries,
            homeShopByNewCategories: homeShopByNewCategoryQueries,
            homeShopByCategoryTitle: homeShopByCategoryTitleQueries,
            legal: legalQueries,
            marketingStrips: marketingStripQueries,
            orders: orderQueries,
            products: productQueries,
            plans: planQueries,
            productTypes: productTypeQueries,
            roles: roleQueries,
            subCategories: subCategoryQueries,
            newsletterSubscribers: subscriberQueries,
            tags: tagQueries,
            tickets: ticketQueries,
            userCarts: userCartQueries,
            users: userQueries,
            userWishlists: userWishlistQueries,
            waitlists: waitlistQueries,
            addresses: addressQueries,
            recommendations: recommendationQueries,
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
