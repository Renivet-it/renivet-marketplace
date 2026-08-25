import fs from "fs/promises";
import path from "path";
import { CorporateCommercialDocumentTemplate } from "@/components/pdf/corporate-commercial-document-template";
import { CorporateSettlementStatementTemplate } from "@/components/pdf/corporate-settlement-statement-template";
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
                    fromLabel: "From",
                    toLabel: "To",
                    from: renivet,
                    to: customer,
                    references: [
                        { label: "Quote number", value: "Q/2627/00001" },
                    ],
                    item,
                    totals: {
                        taxableValuePaise: 40_000,
                        gstRateBps: 1_200,
                        gstAmountPaise: 4_800,
                        totalAmountPaise: 44_800,
                    },
                    notes: [
                        "30% advance on PO confirmation; balance within 15 days of dispatch.",
                        "This proforma invoice is not a tax invoice.",
                    ],
                    bank: {
                        bankName: "IDFC First Bank",
                        accountName: "Renivet Solutions Pvt Ltd",
                        accountNumber: "000000000000",
                        ifsc: "TEST0000000",
                        branch: "Test Branch",
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
                    subtitle: "",
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
                        gstRateBps: 1_800,
                        gstAmountPaise: 5_400,
                    },
                    totals: {
                        taxableValuePaise: 30_000,
                        gstRateBps: 1_800,
                        gstAmountPaise: 5_400,
                        totalAmountPaise: 35_400,
                    },
                    notes: [
                        "Payment as agreed with supplier.",
                        "Supplier invoice must name Renivet as recipient.",
                    ],
                    signatoryName: "Renivet",
                    declarationCompanyName: "Renivet",
                    showSignatureBlock: false,
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
        renderToFile(
            <CorporateSettlementStatementTemplate
                data={{
                    statementNumber: "SET/2627/00001",
                    statementDate: "2026-08-20",
                    orderNumber: "REN-CORP-PO-1787161038701",
                    invoiceNumber: "BAM/2627/00001",
                    grossPaidPaise: 6_300_000,
                    gstEmbeddedPaise: 300_000,
                    taxableValuePaise: 6_000_000,
                    commissionPercent: 20,
                    commissionAmountPaise: 1_200_000,
                    commissionGstRatePercent: 18,
                    commissionGstAmountPaise: 216_000,
                    tcsPercent: 0.5,
                    tcsAmountPaise: 30_000,
                    tdsPercent: 0.1,
                    tdsAmountPaise: 6_300,
                    netRemittancePaise: 4_547_700,
                    brand: {
                        name: "Test Apparel Brand",
                        legalName: "Test Apparel Brand Pvt Ltd",
                        gstin: "19ABCDE9999K1Z1",
                        pan: "ABCDE9999K",
                        address: "Supplier Address, Kolkata, West Bengal, India",
                        bankAccountName: "Test Apparel Brand Pvt Ltd",
                        bankName: "HDFC Bank",
                        bankAccountNumber: "50200012345678",
                        bankIfscCode: "HDFC0001234",
                        bankBranch: "Park Street Branch",
                    },
                    renivet: {
                        name: "Renivet Marketplace Pvt Ltd",
                        address: "Renivet HQ, Kolkata, West Bengal - 700135",
                        gstin: "19AAACR1234F1Z5",
                        pan: "AAACR1234F",
                        supportEmail: "support@renivet.com",
                    },
                    notes: "Remittance processed against delivery confirmation.",
                }}
            />,
            path.join(outputDir, "corporate-settlement-statement-preview.pdf")
        ),
    ]);
    console.log(`Rendered corporate document previews to ${outputDir}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
