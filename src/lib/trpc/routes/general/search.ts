import {
    getSearchCopy,
    getSearchRedirectUrl,
    logSearchQuery,
    processSearch,
} from "@/lib/search/search-engine";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../../trpc";

export const searchRouter = createTRPCRouter({
    /**
     * Process a search query and return intent classification result
     * Implements Stages 1-6 of Search Engine Flow
     */
    processSearch: publicProcedure
        .input(
            z.object({
                query: z.string().min(1).max(500),
                sessionId: z.string().optional(),
                userId: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const { query, sessionId, userId } = input;

            // Process the search query
            const result = await processSearch(query);

            // Log the search for analytics (Stage 10)
            await logSearchQuery(result, sessionId, userId);

            // Return result with routing info
            return {
                ...result,
                redirectUrl: getSearchRedirectUrl(result),
                uiCopy: getSearchCopy(result),
            };
        }),

    /**
     * Log a search click event for analytics
     */
    logSearchClick: publicProcedure
        .input(
            z.object({
                searchId: z.string().optional(),
                productId: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { productId } = input;
            // TODO: Implement click logging
            // This can update the searchAnalytics record with clickedProductId
            return { success: true };
        }),
});
