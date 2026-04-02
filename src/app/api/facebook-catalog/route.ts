import { productQueries } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const productsList = await productQueries.getAllProducts({
            isDeleted: false,
            isPublished: true,
            isAvailable: true,
            verificationStatus: "approved",
            isActive: true,
        });

        const baseUrl = "https://renivet.com"; // Replace with your actual domain
        const FALLBACK_IMAGE_URL = "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

        const sanitizeLink = (url: string) => {
            if (!url) return FALLBACK_IMAGE_URL;
            try {
                // Ensure spaces are encoded and standard URL format is respected
                const parsed = new URL(url.startsWith("/") ? `${baseUrl}${url}` : url);
                return parsed.toString();
            } catch {
                return FALLBACK_IMAGE_URL; // Fallback if link is broken
            }
        };

        const getOptimizedFacebookImageLink = (url: string) => {
            const safeUrl = sanitizeLink(url);
            // Route through Next.js image optimizer to keep feed images lighter for Facebook fetch limits
            return `${baseUrl}/_next/image?url=${encodeURIComponent(safeUrl)}&w=1200&q=70`;
        };

        const getGenderFromCategory = (categoryName?: string | null) => {
            const normalizedCategory = categoryName?.trim().toLowerCase();
            if (!normalizedCategory) return "";

            // Match whole words to avoid false positives like "women" matching "men".
            const hasMen = /\b(men|mens|man|male)\b/.test(normalizedCategory);
            const hasWomen = /\b(women|womens|woman|female|ladies|lady)\b/.test(normalizedCategory);

            if (hasMen && hasWomen) return "unisex";
            if (hasWomen) return "female";
            if (hasMen) return "male";
            return "";
        };

        // Standard Facebook Catalog CSV Headers with Variant Support
        const csvRows = [
            ["id", "item_group_id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand", "color", "size", "gender"]
        ];

        productsList.forEach((product) => {
            const productLink = `${baseUrl}/products/${product.slug}`;
            const brandName = product.brand?.name || "Unknown Brand";
            const escapeCSV = (str: string) => `"${(str || "").replace(/"/g, "\"\"")}"`;
            const description = escapeCSV(product.description || product.title);
            const gender = getGenderFromCategory(product.category?.name);

            if (product.productHasVariants && product.variants?.length > 0) {
                // If product has variants, row for each variant sharing the same item_group_id (parent ID)
                product.variants
                    .filter((v) => !v.isDeleted)
                    .forEach((variant) => {
                        const price = variant.price ? ((variant.price)/100).toFixed(2) + " INR" : "0.00 INR";
                        const availability = variant.quantity && variant.quantity > 0 ? "in stock" : "out of stock";

                        // Ignore out of stock items to remove the warning in Facebook Business Manager
                        if (availability === "out of stock") return;

                        // Use variant specific image, fallback to parent image, sanitize against broken links
                        const rawImageLink = variant.mediaItem?.url || product.media?.[0]?.mediaItem?.url || "";
                        const imageLink = getOptimizedFacebookImageLink(rawImageLink);

                        // Extract color and size from variant dictionary
                        let color = "";
                        let size = "";
                        if (variant.combinations) {
                            Object.entries(variant.combinations).forEach(([key, val]) => {
                                const k = key.toLowerCase();
                                if (k.includes("color") || k.includes("colour")) color = val as string;
                                else if (k.includes("size")) size = val as string;
                            });
                        }

                        // Appending a variant query parameter so users land on the correct variant selection
                        const variantLink = `${productLink}?variant=${variant.id}`;

                        csvRows.push([
                            variant.id,
                            product.id, // item_group_id ties variants together
                            escapeCSV(`${product.title} - ${Object.values(variant.combinations || {}).join(" ")}`), // Specific Title
                            description,
                            availability,
                            "new",
                            price,
                            escapeCSV(variantLink),
                            escapeCSV(imageLink),
                            escapeCSV(brandName),
                            escapeCSV(color),
                            escapeCSV(size),
                            escapeCSV(gender)
                        ]);
                    });
            } else {
                // Single product without variants
                const price = product.price ? ((product.price)/100).toFixed(2) + " INR" : "0.00 INR";
                const availability = product.quantity && product.quantity > 0 ? "in stock" : "out of stock";

                // Ignore out of stock items to remove the warning in Facebook Business Manager
                if (availability === "out of stock") return;

                const rawImageLink = product.media?.[0]?.mediaItem?.url || "";
                const imageLink = getOptimizedFacebookImageLink(rawImageLink);

                csvRows.push([
                    product.id,
                    product.id, // item_group_id
                    escapeCSV(product.title),
                    description,
                    availability,
                    "new",
                    price,
                    escapeCSV(productLink),
                    escapeCSV(imageLink),
                    escapeCSV(brandName),
                    "",
                    "",
                    escapeCSV(gender)
                ]);
            }
        });

        const csvContent = csvRows.map((row) => row.join(",")).join("\n");

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                // This makes it downloadable or fetchable as a CSV file
                "Content-Disposition": "attachment; filename=\"facebook-catalog.csv\"",
            },
        });
    } catch (error) {
        console.error("Facebook feed parsing error: ", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
