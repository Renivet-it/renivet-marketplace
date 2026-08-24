import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
    CorporateReceiptVoucherTemplate,
    type CorporateReceiptVoucherData,
} from "@/components/pdf/corporate-receipt-voucher-template";
import { renderToFile } from "@react-pdf/renderer";
import React from "react";

async function main() {
    const data: CorporateReceiptVoucherData = {
        voucherNumber: "RV/2627/00001",
        voucherDate: "2026-08-05",
        orderNumber: "REN-CORP-TEST-30PCT-20X20",
        poReference: "PO-TEST-30PCT-20X20",
        amountPaise: 12000,
        paymentMode: "Razorpay",
        paymentReference: "TEST-RZP-PAYMENT-30PCT-20X20",
        seller: {
            name: "Renivet",
            address:
                "Dasta Concerto, Yamare Village, Bangalore, Karnataka, 562125",
            gstin: "10AANCR5687A1ZG",
            bankName: "IDFC First Bank",
            bankAccountName: "Renivet Solutions Pvt Ltd",
            bankAccountNumber: "000000000000",
            bankIfscCode: "TEST0000000",
            signatoryName: "Renivet",
            logoUrl:
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNqU6nAZGz8F0U3cHoOhlNY6tCDW7PIAe4fpJw",
        },
        buyer: {
            name: "Renivet Corporate Invoice Test",
            address: "Test Corporate Billing Address, Kolkata, 700001, India",
            gstin: "19AAECT1234G1Z7",
        },
    };
    const outputDirectory = path.resolve("output/pdf");
    const outputPath = path.join(
        outputDirectory,
        "corporate-receipt-voucher-preview.pdf"
    );
    await mkdir(outputDirectory, { recursive: true });
    await renderToFile(
        React.createElement(CorporateReceiptVoucherTemplate, {
            data,
        }) as Parameters<typeof renderToFile>[0],
        outputPath
    );
    console.log(outputPath);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
