import { expect, test } from "bun:test";
import { corporateAdminManualQuoteInputSchema } from "./corporate-platform";

test("manual corporate quotes retain an entered customer GSTIN without GSTIN validation", () => {
    const result = corporateAdminManualQuoteInputSchema.safeParse({
        companyName: "Mili.ai Technologies Private Limited",
        contactPerson: "Siddharth",
        email: "siddharth@getmili.ai",
        phone: "9967280880",
        brandId: "3c7aa246-3c93-4e6c-bc51-19feac13ff07",
        quantity: 30,
        unitPricePaise: 40_000,
        gstNumber: "buyer supplied GST number",
    });

    expect(result.success).toBe(true);
    if (result.success) {
        expect(result.data.gstNumber).toBe("buyer supplied GST number");
    }
});
