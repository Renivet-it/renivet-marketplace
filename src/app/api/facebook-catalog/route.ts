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

        // Standard Facebook Catalog CSV Headers with Variant Support
        const csvRows = [
            ["id", "item_group_id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand", "color", "size"]
        ];

        productsList.forEach((product) => {
            const productLink = `${baseUrl}/products/${product.slug}`;
            const brandName = product.brand?.name || "Unknown Brand";
            const escapeCSV = (str: string) => `"${(str || "").replace(/"/g, "\"\"")}"`;
            const description = escapeCSV(product.description || product.title);

            if (product.productHasVariants && product.variants?.length > 0) {
                // If product has variants, row for each variant sharing the same item_group_id (parent ID)
                product.variants
                    .filter((v) => !v.isDeleted)
                    .forEach((variant) => {
                        const price = variant.price ? ((variant.price)/100).toFixed(2) + " INR" : "0.00 INR";
                        const availability = variant.quantity && variant.quantity > 0 ? "in stock" : "out of stock";

                        // Use variant specific image, fallback to parent image
                        const imageLink = variant.mediaItem?.url || product.media?.[0]?.mediaItem?.url || "";

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
                            escapeCSV(size)
                        ]);
                    });
            } else {
                // Single product without variants
                const price = product.price ? ((product.price)/100).toFixed(2) + " INR" : "0.00 INR";
                const availability = product.quantity && product.quantity > 0 ? "in stock" : "out of stock";
                const imageLink = product.media?.[0]?.mediaItem?.url || "";

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
                    ""
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
