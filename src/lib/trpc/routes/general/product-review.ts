import { env } from "@/../env";
import { BitFieldSitePermission } from "@/config/permissions";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { posthog } from "@/lib/posthog/client";
import { brandCache, userCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import { ProductReviewStatusUpdate } from "@/lib/resend/emails";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { generateProductSlug } from "@/lib/utils";
import { createProductSchema, rejectProductSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { products, productVariants } from "@/lib/db/schema/product";
export const productReviewsRouter = createTRPCRouter({
    addBulkProducts: protectedProcedure
        .input(
            z.object({
                brandId: z.string(),
                products: z.array(createProductSchema),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { products: inputProducts, brandId } = input;

            const existingBrand = await brandCache.get(brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const brandIds = inputProducts.map((product) => product.brandId);
            if (new Set(brandIds).size !== 1)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "All products must belong to the same brand",
                });
        // //    // Extract SKUs from input
        // const inputSKUs = inputProducts.map((product) => product.sku);

        // // Fetch existing products with matching SKUs
        // const existingProducts = await ctx.db.query.products.findMany({
        //     where: (products, { inArray }) => inArray(products.sku, inputSKUs as string[]),
        // });

        // // Create a map of existing SKUs
        // const existingSKUMap = new Map(existingProducts.map((p) => [p.sku, p.title]));

        // // Check for duplicate SKUs and collect errors
        // const errors: { row: number; sku: string; error: string; existingProduct: string }[] = [];
        // inputProducts.forEach((product, index) => {
        //     if (existingSKUMap.has(product.sku)) {
        //         errors.push({
        //             row: index + 2, // Excel row number
        //             sku: product.sku ?? "Unknown SKU",
        //             error: "Duplicate SKU found",
        //             existingProduct: existingSKUMap.get(product.sku) ?? "Unknown Product",
        //         });
        //     }
        // });

        // // If errors exist, return them
        // if (errors.length > 0) {
        //     throw new TRPCError({ code: "BAD_REQUEST", message: "Duplicate SKUs found", cause: errors });
        // }


    //  //    // Extract SKUs from input
    //  const inputSKUs = inputProducts.map((product) => product.sku);

    //  // Fetch existing products with matching SKUs
    //  const existingProducts = await ctx.db.query.products.findMany({
    //      where: (products, { inArray }) => inArray(products.sku, inputSKUs as string[]),
    //  });

    // console.log(existingProducts, "existingProducts");

           // Extract SKUs from input products
           const inputSKUs = inputProducts.map((product) => product.sku);

           // Fetch existing products with matching SKUs
           const existingProducts = await ctx.db.query.products.findMany({
               where: (products, { inArray }) => inArray(products.sku, inputSKUs as string[]),
           });

           // Create a map of existing SKUs for quick lookup
           const existingSKUMap = new Map(existingProducts.map((p) => [p.sku, p.id]));

           // Process updates & inserts separately
           const updatePromises = [];
           const newProducts = [];

           for (const product of inputProducts) {
               const existingProductId = existingSKUMap.get(product.sku);

               if (existingProductId) {
                   // If product exists, update it
                   updatePromises.push(
                       ctx.db.update(products)
                           .set({
                               title: product.title,
                               description: product.description,
                               price: product.price,
                               quantity: product.quantity,
                               metaTitle: product.metaTitle,
                               metaDescription: product.metaDescription,
                               metaKeywords: product.metaKeywords,
                               hsCode: product.hsCode,
                               categoryId: product.categoryId,
                               subcategoryId: product.subcategoryId,
                               productTypeId: product.productTypeId,
                               productHasVariants: product.productHasVariants,
                               width: product.width,
                               height: product.height,
                               length: product.length,
                               weight: product.weight,
                               brandId: product.brandId,
                               updatedAt: new Date(),
                           })
                           .where(eq(products.id, existingProductId))
                   );


  // Handle product variants if provided
  if (product.variants && product.variants.length > 0) {
    const inputVariantSKUs = product.variants.map((variant) => variant.sku);

    // Fetch existing variants with matching SKUs
    const existingVariants = await ctx.db.query.productVariants.findMany({
        where: (productVariants, { inArray }) => inArray(productVariants.sku, inputVariantSKUs as string[]),
    });
console.log(existingVariants, "existingVariants");
    // Map existing variants by SKU
    const existingVariantMap = new Map(existingVariants.map((v) => [v.sku, v.id]));

console.log(existingVariantMap, "existingVariantMap");

    for (const variant of product.variants) {
        const existingVariantId = existingVariantMap.get(variant.sku);

        if (existingVariantId) {
            // Update existing variant
            updatePromises.push(
                ctx.db.update(productVariants)
                    .set({
                        price: variant.price,
                        quantity: variant.quantity,
                        weight: variant.weight,
                        width: variant.width,
                        height: variant.height,
                        length: variant.length,
                        updatedAt: new Date(),
                    })
                    .where(eq(productVariants.id, existingVariantId))
            );
        } else {
            // Insert new variant
            newProducts.push({
                ...variant,
                productId: existingProductId, // Link to the existing product
            });
        }
    }
}



               } else {
                   // If product doesn't exist, prepare for insertion
                   const slug = generateProductSlug(product.title, existingBrand.name);
                   newProducts.push({ ...product, slug });
               }
           }




           // Execute all updates in parallel
           await Promise.all(updatePromises);

           // Insert new products (if any)
        //    let newData = [];
           let newData: any[] = [];
           if (newProducts.length > 0) {
               newData = await queries.products.bulkCreateProducts(newProducts as any);
           }



            // const inputWithSlug = inputProducts.map((product) => {
            //     const slug = generateProductSlug(
            //         product.title,
            //         existingBrand.name
            //     );
            //     return { ...product, slug };
            // });

            // const data =
            //     await queries.products.bulkCreateProducts(inputWithSlug);

            // posthog.capture({
            //     event: POSTHOG_EVENTS.PRODUCT.BULK_CREATED,
            //     distinctId: existingBrand.id,
            //     properties: {
            //         brandName: existingBrand.name,
            //         brandOwnerId: existingBrand.ownerId,
            //         productIds: data.map((product) => product.id),
            //         productTitles: data.map((product) => product.title),
            //     },
            // });

            // return data;
            // Track the event
            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.BULK_CREATED,
                distinctId: existingBrand.id,
                properties: {
                    brandName: existingBrand.name,
                    brandOwnerId: existingBrand.ownerId,
                    productIds: newData.map((product) => product.id),
                    productTitles: newData.map((product) => product.title),
                },
            });

            return newData;
        }),
    approveProduct: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ input, ctx }) => {
            const { queries, user } = ctx;
            const { productId } = input;

            const existingProduct = await queries.products.getProduct({
                productId,
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            const existingBrand = await brandCache.get(existingProduct.brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const cachedOwner = await userCache.get(existingBrand.ownerId);
            if (!cachedOwner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand owner not found",
                });

            if (existingProduct.verificationStatus !== "pending")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Only pending products can be approved",
                });

            const data = await queries.products.approveProduct(productId);

            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: existingBrand.email,
                subject: `Product Approved - ${existingProduct.title}`,
                react: ProductReviewStatusUpdate({
                    user: {
                        name: existingBrand.name,
                    },
                    brand: existingBrand,
                    product: {
                        id: productId,
                        title: existingProduct.title,
                        status: "approved",
                    },
                }),
            });

            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.APRROVED,
                distinctId: user.id,
                properties: {
                    productId,
                    productName: existingProduct.title,
                },
            });

            return data;
        }),
    rejectProduct: protectedProcedure
        .input(rejectProductSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ input, ctx }) => {
            const { queries, user } = ctx;
            const { id, rejectionReason } = input;

            const existingProduct = await queries.products.getProduct({
                productId: id,
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            const existingBrand = await brandCache.get(existingProduct.brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const cachedOwner = await userCache.get(existingBrand.ownerId);
            if (!cachedOwner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand owner not found",
                });

            if (existingProduct.verificationStatus !== "pending")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Only pending products can be rejected",
                });

            const data = await queries.products.rejectProduct(
                id,
                rejectionReason
            );

            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: existingBrand.email,
                subject: `Product Rejected - ${existingProduct.title}`,
                react: ProductReviewStatusUpdate({
                    user: {
                        name: existingBrand.name,
                    },
                    brand: existingBrand,
                    product: {
                        id,
                        title: existingProduct.title,
                        status: "rejected",
                        rejectionReason: rejectionReason ?? undefined,
                    },
                }),
            });

            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.REJECTED,
                distinctId: user.id,
                properties: {
                    productId: id,
                    productName: existingProduct.title,
                    rejectionReason,
                },
            });

            return data;
        }),
});
