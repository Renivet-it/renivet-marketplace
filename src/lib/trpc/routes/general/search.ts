import {
    getSearchCopy,
    getSearchRedirectUrl,
    getSuggestions,
    logSearchProductClick,
    logSearchQuery,
    processSearch,
} from "@/lib/search/search-engine";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../../trpc";

export const searchRouter = createTRPCRouter({
    /**
     * Get search suggestions based on partial query
     * Returns matching keywords from search_intents table
     */
    getSuggestions: publicProcedure
        .input(
            z.object({
                query: z.string().min(1).max(200),
                limit: z.number().min(1).max(10).default(6),
            })
        )
        .query(async ({ input }) => {
            const { query, limit } = input;
            return getSuggestions(query, limit);
        }),

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
            const searchId = await logSearchQuery(result, sessionId, userId);

            // Return result with routing info
            return {
                ...result,
                searchId,
                redirectUrl: getSearchRedirectUrl(result, searchId),
                uiCopy: getSearchCopy(result),
            };
        }),

    /**
     * Log a search click event for analytics
     */
    logSearchClick: publicProcedure
        .input(
            z.object({
                searchId: z.string().uuid().optional(),
                productId: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            if (!input.searchId) return { success: false };

            await logSearchProductClick(input.searchId, input.productId);
            return { success: true };
        }),
});
