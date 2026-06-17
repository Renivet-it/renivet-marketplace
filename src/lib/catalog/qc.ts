import { ProductQcFinding, ProductWithBrand } from "@/lib/validations";

const TITLE_MIN_LENGTH = 12;
const DESCRIPTION_MIN_LENGTH = 80;
const DESCRIPTION_STRONG_LENGTH = 160;
const MIN_PRODUCT_IMAGES = 3;
const STALE_INVENTORY_WARNING_DAYS = 14;
const STALE_INVENTORY_CRITICAL_DAYS = 30;
const MAX_SUSPICIOUS_DISCOUNT_PERCENT = 80;

const CLAIM_PATTERNS = [
    { key: "organic", pattern: /\borganic\b/i },
    { key: "recycled", pattern: /\brecycled\b/i },
    { key: "vegan", pattern: /\bvegan\b/i },
    { key: "gots", pattern: /\bgots\b/i },
    { key: "fair trade", pattern: /\bfair\s*trade\b/i },
    { key: "handmade", pattern: /\bhandmade\b/i },
    { key: "natural", pattern: /\bnatural\b/i },
    { key: "eco", pattern: /\beco[\s-]?(friendly)?\b/i },
    { key: "sustainable", pattern: /\bsustainable\b/i },
    { key: "biodegradable", pattern: /\bbiodegradable\b/i },
];

export type CatalogQcSnapshot = {
    qcStatus: "pass" | "warning" | "critical";
    qcScore: number;
    qcFindings: ProductQcFinding[];
    qcSuggestedFixes: string[];
    qcOwner: "catalog_intern" | "kp" | "system";
    qcEscalatedTo: "catalog_intern" | "kp" | "system" | null;
};

function pushFinding(
    findings: ProductQcFinding[],
    finding: ProductQcFinding
) {
    findings.push(finding);
}

function getActiveImageCount(product: ProductWithBrand) {
    return product.media.filter((item) => item.mediaItem?.url).length;
}

function getProductStock(product: ProductWithBrand) {
    if (product.productHasVariants) {
        return product.variants
            .filter((variant) => !variant.isDeleted)
            .reduce((total, variant) => total + Math.max(variant.quantity ?? 0, 0), 0);
    }

    return Math.max(product.quantity ?? 0, 0);
}

function getBrandScope(product: ProductWithBrand) {
    const certificates =
        product.brand.confidential?.sustainabilityCertificates ?? [];
    return certificates
        .map((certificate) => certificate.key?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value));
}

function detectClaims(product: ProductWithBrand) {
    const valueText =
        product.values?.data
            ?.map((item) => `${item.title} ${item.description ?? ""}`)
            .join(" ") ?? "";
    const specificationText = (product.specifications ?? [])
        .map((spec) => `${spec.key} ${spec.value}`)
        .join(" ");
    const haystack = [
        product.title,
        product.description ?? "",
        product.materialAndCare ?? "",
        valueText,
        specificationText,
    ]
        .join(" ")
        .toLowerCase();

    return CLAIM_PATTERNS.filter((entry) => entry.pattern.test(haystack)).map(
        (entry) => entry.key
    );
}

function getDiscountPercent(
    price: number | null | undefined,
    compareAtPrice: number | null | undefined
) {
    if (!price || !compareAtPrice || compareAtPrice <= price || compareAtPrice <= 0) {
        return null;
    }

    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

function getInventoryAgeDays(product: ProductWithBrand) {
    const sourceDate = product.inventoryLastSyncedAt ?? product.updatedAt;
    if (!sourceDate) return null;

    const ageMs = Date.now() - new Date(sourceDate).getTime();
    return Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
}

export function evaluateCatalogQc(product: ProductWithBrand): CatalogQcSnapshot {
    const findings: ProductQcFinding[] = [];
    const activeImages = getActiveImageCount(product);
    const stock = getProductStock(product);
    const brandScope = getBrandScope(product);
    const claims = detectClaims(product);
    const inventoryAgeDays = getInventoryAgeDays(product);
    const descriptionLength = (product.description ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim().length;

    if ((product.title ?? "").trim().length < TITLE_MIN_LENGTH) {
        pushFinding(findings, {
            code: "weak_title",
            severity: "warning",
            field: "title",
            title: "Title is too short",
            description:
                "The product title is short and may not communicate what the customer is buying.",
            suggestion:
                "Expand the title with product type, material, or a more specific differentiator.",
        });
    }

    if (descriptionLength === 0) {
        pushFinding(findings, {
            code: "missing_description",
            severity: "critical",
            field: "description",
            title: "Description is missing",
            description:
                "The listing has no customer-facing description, which weakens trust and conversion.",
            suggestion:
                "Add a description covering what the product is, what it is made from, and why it is special.",
        });
    } else if (descriptionLength < DESCRIPTION_MIN_LENGTH) {
        pushFinding(findings, {
            code: "weak_description",
            severity: descriptionLength < 40 ? "critical" : "warning",
            field: "description",
            title: "Description needs more detail",
            description:
                "The product description is too brief to answer basic customer questions confidently.",
            suggestion:
                "Expand the description with material, use case, care, fit, or craftsmanship details.",
        });
    } else if (descriptionLength < DESCRIPTION_STRONG_LENGTH) {
        pushFinding(findings, {
            code: "thin_description",
            severity: "info",
            field: "description",
            title: "Description could be stronger",
            description:
                "The listing has a basic description, but it could do more selling and expectation setting.",
            suggestion:
                "Add a richer story, material details, and a clearer explanation of product value.",
        });
    }

    if (activeImages === 0) {
        pushFinding(findings, {
            code: "missing_images",
            severity: "critical",
            field: "media",
            title: "No product images",
            description:
                "The product is live without images, which is a major conversion and trust issue.",
            suggestion:
                "Upload at least 3 clear product images including one strong primary image.",
        });
    } else if (activeImages < MIN_PRODUCT_IMAGES) {
        pushFinding(findings, {
            code: "low_image_count",
            severity: "warning",
            field: "media",
            title: "More images recommended",
            description:
                "The listing has fewer than the recommended number of customer-facing images.",
            suggestion:
                "Add more views such as front, detail, scale, and lifestyle imagery.",
        });
    }

    if (!product.materialAndCare?.trim()) {
        pushFinding(findings, {
            code: "missing_material_and_care",
            severity: "warning",
            field: "materialAndCare",
            title: "Material and care details are missing",
            description:
                "Customers cannot see what the product is made from or how to care for it.",
            suggestion:
                "Add material composition and care instructions.",
        });
    }

    if (!product.hsCode?.trim()) {
        pushFinding(findings, {
            code: "missing_hs_code",
            severity: "warning",
            field: "hsCode",
            title: "HS code is missing",
            description:
                "The product does not have an HS code for operational and classification workflows.",
            suggestion:
                "Add the correct HS code for the product type.",
        });
    }

    if (!product.originCountry?.trim()) {
        pushFinding(findings, {
            code: "missing_origin_country",
            severity: "info",
            field: "originCountry",
            title: "Origin country is missing",
            description:
                "Country of origin is not set, which can create customer and compliance ambiguity.",
            suggestion: "Add the country of origin.",
        });
    }

    if (!product.categoryId || !product.subcategoryId || !product.productTypeId) {
        pushFinding(findings, {
            code: "missing_taxonomy",
            severity: "critical",
            field: "categoryId",
            title: "Category mapping is incomplete",
            description:
                "The listing does not have a complete category, subcategory, and product type mapping.",
            suggestion:
                "Assign the correct category hierarchy before merchandising or campaign usage.",
        });
    }

    if (!product.returnExchangePolicy) {
        pushFinding(findings, {
            code: "missing_return_policy_record",
            severity: "warning",
            field: "returnExchangePolicy",
            title: "Return policy record is missing",
            description:
                "The listing is missing its return and exchange policy configuration.",
            suggestion:
                "Open the Return & Exchange section and configure returnability and exchangeability.",
        });
    } else if (
        product.returnExchangePolicy.returnable &&
        !product.returnExchangePolicy.returnDescription?.trim()
    ) {
        pushFinding(findings, {
            code: "weak_return_policy",
            severity: "info",
            field: "returnExchangePolicy",
            title: "Return policy explanation is thin",
            description:
                "The listing allows returns, but the customer-facing explanation is empty.",
            suggestion:
                "Add a short return policy explanation with timelines or conditions.",
        });
    }

    if (product.productHasVariants) {
        const hasMissingVariantDimensions = product.variants.some(
            (variant) =>
                !variant.isDeleted &&
                (!variant.weight || !variant.length || !variant.width || !variant.height)
        );

        if (hasMissingVariantDimensions) {
            pushFinding(findings, {
                code: "missing_variant_dimensions",
                severity: "warning",
                field: "variants",
                title: "Some variants are missing dimensions",
                description:
                    "One or more active variants are missing shipping dimensions or weight.",
                suggestion:
                    "Fill weight and dimensions for every active variant used for fulfillment.",
            });
        }
    } else if (!product.weight || !product.length || !product.width || !product.height) {
        pushFinding(findings, {
            code: "missing_dimensions",
            severity: "warning",
            field: "weight",
            title: "Shipping dimensions are incomplete",
            description:
                "The listing is missing product-level weight or dimensions required for fulfillment quality.",
            suggestion:
                "Add weight, length, width, and height for the product.",
        });
    }

    const productDiscount = getDiscountPercent(product.price, product.compareAtPrice);
    const variantDiscounts = product.variants
        .map((variant) =>
            getDiscountPercent(variant.price, variant.compareAtPrice ?? null)
        )
        .filter((value): value is number => value !== null);
    const maxDiscount = Math.max(productDiscount ?? 0, ...variantDiscounts, 0);

    if (maxDiscount >= MAX_SUSPICIOUS_DISCOUNT_PERCENT) {
        pushFinding(findings, {
            code: "suspicious_discount",
            severity: "critical",
            field: "compareAtPrice",
            title: "Discount looks suspiciously high",
            description:
                "The compare-at-price setup suggests an unusually large discount that should be verified.",
            suggestion:
                "Verify that the compare-at-price reflects a genuine MRP and not an inflated anchor price.",
        });
    } else if (maxDiscount >= 60) {
        pushFinding(findings, {
            code: "high_discount",
            severity: "warning",
            field: "compareAtPrice",
            title: "High discount should be reviewed",
            description:
                "The listing shows a large discount and may need a quick sanity check.",
            suggestion:
                "Confirm that the MRP and selling price are accurate and defensible.",
        });
    }

    if (claims.length > 0 && brandScope.length === 0) {
        pushFinding(findings, {
            code: "claim_without_brand_scope",
            severity: "critical",
            field: "sustainabilityCertificate",
            title: "Sustainability claim has no verified brand scope",
            description:
                "The listing appears to make sustainability claims, but the brand has no recorded verified scope.",
            suggestion:
                "Either remove the claim from the listing or update the brand’s verified sustainability scope.",
        });
    } else if (
        claims.length > 0 &&
        brandScope.length > 0 &&
        claims.some((claim) => !brandScope.some((scope) => scope.includes(claim)))
    ) {
        const unsupportedClaims = claims.filter(
            (claim) => !brandScope.some((scope) => scope.includes(claim))
        );
        pushFinding(findings, {
            code: "claim_scope_mismatch",
            severity: "critical",
            field: "sustainabilityCertificate",
            title: "Listing claim may not match verified scope",
            description: `Detected claims may exceed the brand's verified scope: ${unsupportedClaims.join(", ")}.`,
            suggestion:
                "Review the claim text and align it with the verified certificates or update the brand scope documentation.",
        });
    }

    if (
        product.brand.confidential?.sustainabilityCertificateExpiresAt &&
        new Date(product.brand.confidential.sustainabilityCertificateExpiresAt) <
            new Date()
    ) {
        pushFinding(findings, {
            code: "expired_sustainability_certificate",
            severity: "critical",
            field: "sustainabilityCertificate",
            title: "Brand sustainability certificate is expired",
            description:
                "The brand’s sustainability certificate expiry date has passed while claim-bearing products remain live.",
            suggestion:
                "Refresh the certificate or temporarily remove claim language from affected products.",
        });
    }

    if (stock <= 0 && product.isAvailable) {
        pushFinding(findings, {
            code: "oos_but_available",
            severity: "critical",
            field: "isAvailable",
            title: "Product is sellable while out of stock",
            description:
                "The product has zero stock but is still marked available, which can cause oversell issues.",
            suggestion:
                "Auto-pause sellability until stock is restored or manually verify inventory.",
        });
    }

    if (inventoryAgeDays !== null) {
        if (inventoryAgeDays >= STALE_INVENTORY_CRITICAL_DAYS) {
            pushFinding(findings, {
                code: "inventory_stale_critical",
                severity: "critical",
                field: "inventoryLastSyncedAt",
                title: "Inventory update is very stale",
                description:
                    "Inventory has not been refreshed in more than 30 days.",
                suggestion:
                    "Trigger an inventory refresh or ask the brand to update stock immediately.",
            });
        } else if (inventoryAgeDays >= STALE_INVENTORY_WARNING_DAYS) {
            pushFinding(findings, {
                code: "inventory_stale_warning",
                severity: "warning",
                field: "inventoryLastSyncedAt",
                title: "Inventory update is getting stale",
                description:
                    "Inventory has not been refreshed in more than 14 days.",
                suggestion:
                    "Prompt the brand or sync integration to refresh stock data.",
            });
        }
    }

    const qcScore = Math.max(
        0,
        Math.min(
            100,
            findings.reduce((score, finding) => {
                if (finding.severity === "critical") return score - 20;
                if (finding.severity === "warning") return score - 10;
                return score - 4;
            }, 100)
        )
    );

    const qcStatus = findings.some((finding) => finding.severity === "critical")
        ? "critical"
        : findings.some((finding) => finding.severity === "warning")
          ? "warning"
          : "pass";

    const qcSuggestedFixes = Array.from(
        new Set(
            findings
                .map((finding) => finding.suggestion?.trim())
                .filter((value): value is string => Boolean(value))
        )
    );

    const hasKpEscalation = findings.some((finding) =>
        [
            "claim_without_brand_scope",
            "claim_scope_mismatch",
            "expired_sustainability_certificate",
            "suspicious_discount",
        ].includes(finding.code)
    );

    return {
        qcStatus,
        qcScore,
        qcFindings: findings,
        qcSuggestedFixes,
        qcOwner:
            qcStatus === "pass"
                ? "system"
                : hasKpEscalation
                  ? "kp"
                  : "catalog_intern",
        qcEscalatedTo:
            qcStatus === "pass"
                ? null
                : hasKpEscalation
                  ? "kp"
                  : "catalog_intern",
    };
}
