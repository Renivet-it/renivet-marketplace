export type RawHsnImportRow = Record<string, unknown>;

export type HsnImportRow = {
    sku: string;
    hsCode: string;
};

export type HsnImportError = {
    row: number;
    sku: string;
    code: "missing_sku" | "blank_hsn" | "invalid_hsn" | "duplicate_sku";
    message: string;
};

export type HsnResolution = HsnImportRow &
    ({ status: "product"; id: string } | { status: "variant"; id: string; productId: string } | { status: "unmatched" | "ambiguous" });

const getValue = (row: RawHsnImportRow, names: string[]) => {
    const entry = Object.entries(row).find(([key]) =>
        names.includes(key.trim().toLowerCase())
    );
    return typeof entry?.[1] === "string" || typeof entry?.[1] === "number"
        ? String(entry[1]).trim()
        : "";
};

export function normalizeHsnImportRows(rows: RawHsnImportRow[]) {
    const normalized: HsnImportRow[] = [];
    const errors: HsnImportError[] = [];
    const seen = new Set<string>();

    rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const sku = getValue(row, ["sku", "native sku"]);
        const hsCode = getValue(row, ["hs code", "hsn code", "hscode", "hsncode"]);

        if (!sku) {
            errors.push({ row: rowNumber, sku: "", code: "missing_sku", message: "SKU is missing" });
            return;
        }
        if (!hsCode) {
            errors.push({ row: rowNumber, sku, code: "blank_hsn", message: "HSN code is blank" });
            return;
        }
        if (!/^\d{4,8}$/.test(hsCode)) {
            errors.push({ row: rowNumber, sku, code: "invalid_hsn", message: "HSN code must contain 4 to 8 digits" });
            return;
        }
        if (seen.has(sku)) {
            errors.push({ row: rowNumber, sku, code: "duplicate_sku", message: "Duplicate SKU is not accepted" });
            return;
        }
        seen.add(sku);
        normalized.push({ sku, hsCode });
    });

    return { rows: normalized, errors };
}

export function resolveHsnImportRows(
    rows: HsnImportRow[],
    products: Array<{ id: string; sku: string | null; hsCode: string | null }>,
    variants: Array<{ id: string; sku: string | null; productId: string; hsCode: string | null }>
): HsnResolution[] {
    const productsBySku = new Map(products.filter((row) => row.sku).map((row) => [row.sku!, row]));
    const variantsBySku = new Map(variants.filter((row) => row.sku).map((row) => [row.sku!, row]));

    return rows.map((row) => {
        const product = productsBySku.get(row.sku);
        const variant = variantsBySku.get(row.sku);
        if (product && variant) return { ...row, status: "ambiguous" };
        if (variant) return { ...row, status: "variant", id: variant.id, productId: variant.productId };
        if (product) return { ...row, status: "product", id: product.id };
        return { ...row, status: "unmatched" };
    });
}
