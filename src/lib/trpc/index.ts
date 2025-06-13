import {
    analyticsRouter as brandAnalyticsRouter,
    bansRouter as brandBansRouter,
    brandsRouter as brandBrandsRouter,
    categoryRequestsRouter as brandCategoryRequestsRouter,
    confidentialsRouter as brandConfidentialsRouter,
    invitesRouter as brandInvitesRouter,
    mediaRouter as brandMediaRouter,
    membersRouter as brandMembersRouter,
    ordersRouter as brandOrdersRouter,
    pageSectionsRouter as brandPageSectionsRouter,
    productsRouter as brandProductsRouter,
    revenueRouter as brandRevenueRouter,
    rolesRouter as brandRolesRouter,
} from "./routes/brands";
import {
    blogsRouter,
    brandsRouter,
    brandsWaitlistRouter,
    categoriesRouter,
    contentRouter,
    couponRouter,
    legalRouter,
    newsletterSubscriberRouter,
    ordersRouter,
    plansRouter,
    productReviewsRouter,
    productTypesRouter,
    rolesRouter,
    subCategoriesRouter,
    tagsRouter,
    ticketRouter,
    usersRouter,
    OrderReturnRouter
} from "./routes/general";
import { addressesRouter } from "./routes/general/address";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    general: createTRPCRouter({
        blogs: blogsRouter,
        brands: brandsRouter,
        brandsWaitlist: brandsWaitlistRouter,
        categories: categoriesRouter,
        content: contentRouter,
        coupons: couponRouter,
        legal: legalRouter,
        newsletterSubscribers: newsletterSubscriberRouter,
        orders: ordersRouter,
        plans: plansRouter,
        productReviews: productReviewsRouter,
        productTypes: productTypesRouter,
        roles: rolesRouter,
        subCategories: subCategoriesRouter,
        tags: tagsRouter,
        tickets: ticketRouter,
        users: usersRouter,
        addresses: addressesRouter,
        orderReturns: OrderReturnRouter
    }),
    brands: createTRPCRouter({
        analytics: brandAnalyticsRouter,
        bans: brandBansRouter,
        brands: brandBrandsRouter,
        categoryRequests: brandCategoryRequestsRouter,
        confidentials: brandConfidentialsRouter,
        invites: brandInvitesRouter,
        media: brandMediaRouter,
        members: brandMembersRouter,
        orders: brandOrdersRouter,
        pageSections: brandPageSectionsRouter,
        products: brandProductsRouter,
        revenue: brandRevenueRouter,
        roles: brandRolesRouter,
    }),
});

export type AppRouter = typeof appRouter;
