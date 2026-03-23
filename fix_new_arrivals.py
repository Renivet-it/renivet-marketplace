import re

file_path = 'c:/Personal Projects/renivet-marketplace/src/actions/product-action.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

correct_code = """export async function toggleHomeNewArrivalsProduct(
    productId: string,
    isActive: boolean,
    category: string,
    position?: number
) {
    try {
        // âœ Check if product exists
        const existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .then((res) => res[0]);

        if (!existingProduct) {
            return { success: false, error: "Product not found" };
        }

        // =============================
        // ðŸŸ ADD PRODUCT TO CATEGORY
        // =============================
        if (isActive) {
            const existing = await db
                .select()
                .from(homeNewArrivals)
                .where(eq(homeNewArrivals.productId, productId))
                .then((res) => res[0]);

            // âœ Only block if already active *and* we're adding again *and* it's the exact same category
            if (existing && !existing.isDeleted && existing.category === category) {
                return {
                    success: false,
                    error: "Product is already in New Arrivals in this category",
                };
            }

            if (existing) {
                // Reactivate + update category
                await db
                    .update(homeNewArrivals)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        category,
                        ...(position !== undefined ? { position } : {}),
                    })
                    .where(eq(homeNewArrivals.productId, productId));
            } else {
                // Insert new record
                await db.insert(homeNewArrivals).values({
                    productId,
                    category,
                    ...(position !== undefined ? { position } : {}),
                });
            }

            // âœ Update product table flag
            await db
                .update(products)
                .set({
                    isHomeNewArrival: true,
                })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: `Product added to New Arrivals category: ${category}`,
            };
        }

        // =============================
        // ðŸ” REMOVE PRODUCT
        // =============================
        const existing = await db
            .select()
            .from(homeNewArrivals)
            .where(eq(homeNewArrivals.productId, productId))
            .then((res) => res[0]);

        if (!existing) {
            return {
                success: false,
                error: "Product not found in New Arrivals list",
            };
        }

        await db
            .update(homeNewArrivals)
            .set({
                isDeleted: true,
                deletedAt: new Date(),
            })
            .where(eq(homeNewArrivals.productId, productId));

        // Update ishomeProductSection to false in products table
        await db
            .update(products)
            .set({ isHomeNewArrival: false })
            .where(eq(products.id, productId));

        revalidatePath("/dashboard/general/products");
        return {
            success: true,
            message: "Product removed from New Arrivals list",
        };
    } catch (error) {
        console.error("Error toggling New Arrivals status:", error);
        return {
            success: false,
            error: "Failed to update New Arrivals status",
        };
    }
}"""

pattern = r"export async function toggleHomeNewArrivalsProduct\([\s\S]*?\}\s*catch\s*\(error\)\s*\{[\s\S]*?\}\s*\}"

if re.search(pattern, text):
    text = re.sub(pattern, correct_code, text)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed toggleHomeNewArrivalsProduct in product-action.ts!")
else:
    print("Could not find toggleHomeNewArrivalsProduct using regex!")

