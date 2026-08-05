import fs from "fs/promises";
import path from "path";
import { CorporateCommercialDocumentTemplate } from "@/components/pdf/corporate-commercial-document-template";
import { renderToFile } from "@react-pdf/renderer";

const outputDir = path.join(process.cwd(), "output", "pdf");
const renivet = {
    name: "Renivet",
    address: "Renivet Business Address, Kolkata, West Bengal 700001, India",
    gstin: "19ABCDE1234F1Z5",
    email: "corporate@renivet.com",
    phone: "+91 90000 00000",
};
const customer = {
    name: "Renivet Corporate Test Company",
    address: "Test Delivery Address, Kolkata, West Bengal 700001, India",
    gstin: "19ABCDE5678G1Z2",
};
const item = {
    description: "Corporate T-shirt",
    detail: "Approved crew-neck T-shirt specification",
    sku: "TEST-TSHIRT-20",
    hsn: "6109",
    quantity: 20,
    unitRatePaise: 2_000,
    amountPaise: 40_000,
};

async function main() {
    await fs.mkdir(outputDir, { recursive: true });
    await Promise.all([
        renderToFile(
            <CorporateCommercialDocumentTemplate
                data={{
                    title: "Proforma Invoice",
                    subtitle:
                        "Commercial proposal issued before supply. This is not a tax invoice.",
                    documentNumber: "PI/2627/00001",
                    documentDate: "2026-08-06",
                    validUntil: "2026-08-20",
                    fromLabel: "Issued by",
                    toLabel: "Proforma for",
                    from: renivet,
                    to: customer,
                    references: [
                        { label: "Quote number", value: "Q/2627/00001" },
                    ],
                    item,
                    totals: {
                        taxableValuePaise: 40_000,
                        totalAmountPaise: 40_000,
                    },
                    notes: [
                        "30% advance on PO confirmation; balance within 15 days of dispatch.",
                        "This proforma invoice is not a tax invoice.",
                    ],
                    bank: {
                        bankName: "IDFC",
                        accountName: "Renivet",
                        accountNumber: "73564993505",
                        ifsc: "IDFB0090174",
                    },
                    signatoryName: "Renivet",
                    declarationCompanyName: "Renivet",
                }}
            />,
            path.join(outputDir, "corporate-proforma-invoice-preview.pdf")
        ),
        renderToFile(
            <CorporateCommercialDocumentTemplate
                data={{
                    title: "Purchase Order",
                    subtitle:
                        "Purchase order issued by Renivet to the fulfilment brand at the agreed buy price.",
                    documentNumber: "RPO/2627/00001",
                    documentDate: "2026-08-06",
                    validUntil: "2026-08-18",
                    fromLabel: "Buyer",
                    toLabel: "Supplier",
                    from: renivet,
                    to: {
                        name: "Test Apparel Brand",
                        address:
                            "Supplier Address, Kolkata, West Bengal, India",
                        gstin: "19ABCDE9999K1Z1",
                    },
                    references: [
                        {
                            label: "Corporate order",
                            value: "TEST-CORP-20X20-30",
                        },
                        {
                            label: "Customer PO",
                            value: "TEST-CUSTOMER-PO-20X20",
                        },
                        { label: "Delivery mode", value: "Direct to customer" },
                    ],
                    item: {
                        ...item,
                        unitRatePaise: 1_500,
                        amountPaise: 30_000,
                    },
                    totals: {
                        taxableValuePaise: 30_000,
                        cgstPaise: 2_700,
                        sgstPaise: 2_700,
                        totalAmountPaise: 35_400,
                    },
                    notes: [
                        "Payment as agreed with supplier.",
                        "Supplier invoice must name Renivet as recipient.",
                    ],
                    signatoryName: "Renivet",
                    declarationCompanyName: "Renivet",
                }}
            />,
            path.join(outputDir, "corporate-renivet-purchase-order-preview.pdf")
        ),
        renderToFile(
            <CorporateCommercialDocumentTemplate
                data={{
                    title: "Delivery Challan",
                    subtitle:
                        "Goods movement document for direct fulfilment on behalf of Renivet. Not a tax invoice.",
                    documentNumber: "DC/2627/00001",
                    documentDate: "2026-08-18",
                    fromLabel: "Consignor / shipper",
                    toLabel: "Consignee",
                    from: {
                        name: "Test Apparel Brand",
                        address:
                            "Supplier Address, Kolkata, West Bengal, India",
                    },
                    to: customer,
                    references: [
                        {
                            label: "Corporate order",
                            value: "TEST-CORP-20X20-30",
                        },
                        { label: "Renivet PO", value: "RPO/2627/00001" },
                        { label: "On behalf of", value: "Renivet" },
                        { label: "E-way bill", value: "EWB-TEST-0001" },
                    ],
                    item: { ...item, unitRatePaise: null, amountPaise: null },
                    totals: null,
                    notes: [
                        "This challan records movement of goods only.",
                        "The consignee should verify package count and condition.",
                    ],
                    signatoryName: "Renivet",
                    declarationCompanyName: "Renivet",
                }}
            />,
            path.join(outputDir, "corporate-delivery-challan-preview.pdf")
        ),
    ]);
    console.log(`Rendered corporate document previews to ${outputDir}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
