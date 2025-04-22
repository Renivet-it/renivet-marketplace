import { env } from "@/../env";
import { InferenceClient } from "@huggingface/inference";
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
import { products, productVariants, returnExchangePolicy, productSpecifications } from "@/lib/db/schema/product";
import { getEmbedding } from "@/lib/python/sematic-search";

const token = process.env.HF_TOKEN;
if (!token) {
  console.error("HF_TOKEN environment variable is not set");
}
const client = new InferenceClient(token);

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


           // Extract SKUs from input products
           const inputSKUs = inputProducts.map((product) => product.sku);

           // Fetch existing products with matching SKUs
        //    const existingProducts = await ctx.db.query.products.findMany({
        //        where: (products, { inArray }) => inArray(products.sku, inputSKUs as string[]),
        //    });

        // Fetch existing products with matching SKUs and brandId
            const existingProducts = await ctx.db.query.products.findMany({
                where: (products, { and, inArray, eq }) =>
                    and(
                        inArray(products.sku, inputSKUs as string[]),
                        eq(products.brandId, brandId)
                    ),
            });
           // Create a map of existing SKUs for quick lookup
           const existingSKUMap = new Map(existingProducts.map((p) => [p.sku, p.id]));
            // Fetch existing return exchange policies for existing products
            const existingReturnPolicies = await ctx.db.query.returnExchangePolicy.findMany({
                where: (returnExchangePolicy, { inArray }) =>
                    inArray(
                        returnExchangePolicy.productId,
                        Array.from(existingSKUMap.values())
                    ),
            });

            // Create a map of existing return policies by productId
            const existingReturnPolicyMap = new Map(
                existingReturnPolicies.map((rp) => [rp.productId, rp])
            );
                     // Fetch existing specifications for existing products
                     const existingSpecifications = await ctx.db.query.productSpecifications.findMany({
                        where: (productSpecifications, { inArray }) =>
                            inArray(
                                productSpecifications.productId,
                                Array.from(existingSKUMap.values())
                            ),
                    });

                    // Create a map of existing specifications by productId
                    const existingSpecificationsMap = new Map<string | null, typeof existingSpecifications>();
                    existingSpecifications.forEach((spec) => {
                        if (!existingSpecificationsMap.has(spec.productId)) {
                            existingSpecificationsMap.set(spec.productId, []);
                        }
                        existingSpecificationsMap.get(spec.productId)!.push(spec);
                    });

           // Process updates & inserts separately
           const updatePromises = [];
           const newProducts: any[] = [];

           for (const product of inputProducts) {
             const category = await queries.categories.getCategory(product.categoryId);

             const productTypeName = await queries.productTypes.getProductType(product.productTypeId);
             const subCategoryName = await queries.subCategories.getSubCategory(product.subcategoryId);

             const specsText = (product.specifications ?? [])
        .map((spec) => `${spec.key}:${spec.value}`)
        .join(" ");

      const text = [
        product.title,
        product.description || "",
        product.sizeAndFit || "",
        product.metaTitle || "",
        product.metaDescription || "",
        product.materialAndCare || "",
        (product as any).brand?.name || existingBrand.name || "",
        (product as any).category?.name || (category as any).name || "",
        (product as any).subcategory?.name || (subCategoryName as any).name || "",
        (product as any).productType?.name || (productTypeName as any).name || "",
        specsText,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      console.log("Text for embedding:", text);

      let embeddings: number[] | null = null;
      if (text) {
        try {
        //   console.log("Calling Hugging Face API for feature extraction...");
        //   const response = await client.featureExtraction({
        //     model: "sentence-transformers/all-MiniLM-L6-v2",
        //     inputs: text,
        //   });

        //   console.log("Hugging Face API response:", response);

        //   const embeddingArray = Array.isArray(response) ? response : (response as any).data;
            const embeddingArray = await getEmbedding(text);
          if (!Array.isArray(embeddingArray) || embeddingArray.length !== 384) {
            console.error(`Invalid embedding for product with SKU ${product.sku}. Response length: ${embeddingArray?.length}`);
          } else {
            embeddings = embeddingArray;
            console.log(`Generated embedding for product ${product.sku}: ${embeddings.length} dimensions`);
          }
        } catch (error) {
          console.error(`Error generating embedding for product with SKU ${product.sku}:`, error);
        }
      } else {
        console.warn(`No text available for embedding generation for product with SKU ${product.sku}`);
      }
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
                               materialAndCare: product.materialAndCare,
                               sizeAndFit: product.sizeAndFit,
                                embeddings,
                               updatedAt: new Date(),
                           })
                           .where(eq(products.id, existingProductId))
                   );
                    // Update or insert return exchange policy
                    const existingPolicy = existingReturnPolicyMap.get(existingProductId);
                    if (existingPolicy) {
                        // Update existing return exchange policy
                        updatePromises.push(
                            ctx.db.update(returnExchangePolicy)
                                .set({
                                    returnable: product.returnable,
                                    exchangeable: product.exchangeable,
                                    returnDescription: product.returnDescription,
                                    exchangeDescription: product.exchangeDescription,
                                    updatedAt: new Date(),
                                })
                                .where(eq(returnExchangePolicy.productId, existingProductId))
                        );
                    } else {
                        // Insert new return exchange policy
                        updatePromises.push(
                            ctx.db.insert(returnExchangePolicy).values({
                                id: crypto.randomUUID(),
                                productId: existingProductId,
                                returnable: product.returnable,
                                exchangeable: product.exchangeable,
                                returnDescription: product.returnDescription,
                                exchangeDescription: product.exchangeDescription,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            })
                        );
                    }
                // Update specifications: delete existing and insert new
                updatePromises.push(
                    ctx.db.delete(productSpecifications)
                        .where(eq(productSpecifications.productId, existingProductId))
                );
                if (product.specifications && product.specifications.length > 0) {
                    updatePromises.push(
                        ctx.db.insert(productSpecifications).values(
                            product.specifications.map((spec) => ({
                                id: crypto.randomUUID(),
                                productId: existingProductId,
                                key: spec.key,
                                value: spec.value,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }))
                        )
                    );
                }


if (product.variants && product.variants.length > 0) {
    const inputVariantSKUs = product.variants.map((variant) => variant.sku);
    const existingVariants = await ctx.db.query.productVariants.findMany({
        where: (productVariants, { inArray }) => inArray(productVariants.sku, inputVariantSKUs as string[]),
    });
    const existingVariantMap = new Map(existingVariants.map((v) => [v.sku, v.id]));

    for (const variant of product.variants) {
        const existingVariantId = existingVariantMap.get(variant.sku);
        if (existingVariantId) {
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
            updatePromises.push(
                ctx.db.insert(productVariants).values({
                    id: variant.id || crypto.randomUUID(),
                    productId: existingProductId,
                    sku: variant.sku,
                    price: variant.price,
                    quantity: variant.quantity,
                    weight: variant.weight,
                    width: variant.width,
                    height: variant.height,
                    length: variant.length,
                    combinations: variant.combinations,
                    nativeSku: variant.nativeSku,
                    barcode: variant.barcode,
                    hsCode: variant.hsCode,
                    originCountry: variant.originCountry,
                    image: variant.image,
                    isDeleted: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
            );
        }
    }
}



               } else {

                const slug = generateProductSlug(product.title, existingBrand.name);
                newProducts.push({
                    ...product,
                    slug,
                     embeddings,
                    returnExchangePolicy: {
                        returnable: product.returnable,
                        exchangeable: product.exchangeable,
                        returnDescription: product.returnDescription,
                        exchangeDescription: product.exchangeDescription,
                    },
                    specifications: product.specifications || [],
                });
               }
           }




           // Execute all updates in parallel
           await Promise.all(updatePromises);

           // Insert new products (if any)
           let newData: any[] = [];

        if (newProducts.length > 0) {
            // Insert new products
            newData = await queries.products.bulkCreateProducts(
                newProducts.map((p) => ({
                    ...p,
                    // Exclude returnExchangePolicy and specifications from product insertion
                    returnable: undefined,
                    exchangeable: undefined,
                    returnDescription: undefined,
                    exchangeDescription: undefined,
                    specifications: undefined,
                }))
            );

            // Insert return exchange policies for new products
            const returnPolicyInserts = newData.map((product) => {
                const inputProduct = newProducts.find((p) => p.sku === product.sku);
                return {
                    id: crypto.randomUUID(),
                    productId: product.id,
                    returnable: inputProduct?.returnable ?? false,
                    exchangeable: inputProduct?.exchangeable ?? false,
                    returnDescription: inputProduct?.returnDescription ?? null,
                    exchangeDescription: inputProduct?.exchangeDescription ?? null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            });

            if (returnPolicyInserts.length > 0) {
                await ctx.db.insert(returnExchangePolicy).values(returnPolicyInserts);
            }

            // Insert specifications for new products
            const specificationInserts = newData.flatMap((product) => {
                const inputProduct = newProducts.find((p) => p.sku === product.sku);
                return (inputProduct?.specifications ?? []).map((spec: any) => ({
                    id: crypto.randomUUID(),
                    productId: product.id,
                    key: spec.key,
                    value: spec.value,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }));
            });

            if (specificationInserts.length > 0) {
                await ctx.db.insert(productSpecifications).values(specificationInserts);
            }
        }


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
