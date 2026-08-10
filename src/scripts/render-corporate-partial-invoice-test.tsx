import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
    CorporateTaxInvoiceTemplate,
    type CorporateTaxInvoiceData,
} from "@/components/pdf/corporate-tax-invoice-template";
import { renderToFile } from "@react-pdf/renderer";
import { config } from "dotenv";
import React from "react";

config({ path: ".env.local" });

async function main() {
    const [{ eq, desc }, { db }, schema] = await Promise.all([
        import("drizzle-orm"),
        import("@/lib/db"),
        import("@/lib/db/schema"),
    ]);

    const order = await db.query.corporateOrders.findFirst({
        where: (table, { eq }) =>
            eq(table.publicOrderId, "REN-CORP-TEST-30PCT-20X20"),
        with: { brand: true },
    });

    if (!order?.brand)
        throw new Error("Test corporate order or seller is missing");

    const [invoice, purchaseOrder, confidential] = await Promise.all([
        db.query.corporateTaxInvoices.findFirst({
            where: eq(schema.corporateTaxInvoices.orderId, order.id),
            orderBy: [desc(schema.corporateTaxInvoices.createdAt)],
        }),
        db.query.corporatePurchaseOrders.findFirst({
            where: eq(
                schema.corporatePurchaseOrders.corporateOrderId,
                order.id
            ),
            orderBy: [desc(schema.corporatePurchaseOrders.createdAt)],
        }),
        db.query.brandConfidentials.findFirst({
            where: eq(schema.brandConfidentials.id, order.brand.id),
        }),
    ]);

    if (!invoice) throw new Error("Test corporate invoice is missing");

    const sellerAddress = [
        confidential?.addressLine1,
        confidential?.addressLine2,
        confidential?.city,
        confidential?.state,
        confidential?.postalCode,
        confidential?.country,
    ]
        .filter(Boolean)
        .join(", ");

    const data: CorporateTaxInvoiceData = {
        invoice: {
            ...invoice,
            cgstPaise: 0,
            sgstPaise: 0,
            igstPaise: invoice.cgstPaise + invoice.sgstPaise,
        },
        order: {
            ...order,
            paymentMethod: "manual",
            paymentId: order.paymentReference,
        },
        seller: {
            name: order.brand.name,
            logoUrl: order.brand.logoUrl,
            email: order.brand.email,
            phone: order.brand.phone,
            gstin: confidential?.gstin,
            address: sellerAddress,
            addressLine1: confidential?.addressLine1,
            addressLine2: confidential?.addressLine2,
            city: confidential?.city,
            state: confidential?.state,
            postalCode: confidential?.postalCode,
            country: confidential?.country,
            bankName: confidential?.bankName,
            bankAccountHolderName: confidential?.bankAccountHolderName,
            bankAccountNumber: confidential?.bankAccountNumber,
            bankAccountType: confidential?.bankAccountType,
            bankIfscCode: confidential?.bankIfscCode,
            authorizedSignatoryName: confidential?.authorizedSignatoryName,
        },
        buyer: {
            companyName: order.companyName,
            gstNumber: order.gstNumber ?? "19AAECT1234G1Z7",
            billingAddress: [
                order.deliveryAddress,
                order.deliveryCity,
                order.deliveryPincode,
                order.deliveryCountry,
            ]
                .filter(Boolean)
                .join(", "),
            placeOfSupply: "West Bengal",
        },
        purchaseOrder: purchaseOrder
            ? {
                  poNumber: purchaseOrder.poNumber,
                  poDate: purchaseOrder.poDate,
              }
            : null,
        product: {
            title: "Corporate Cotton T-Shirt",
            sku: "CORP-TSHIRT-TEST",
            hsn: "6109",
        },
    };

    const outputDirectory = path.resolve("output/pdf");
    const outputPath = path.join(
        outputDirectory,
        "corporate-partial-invoice-test.pdf"
    );
    const fullPaymentOutputPath = path.join(
        outputDirectory,
        "corporate-full-payment-invoice-preview.pdf"
    );
    await mkdir(outputDirectory, { recursive: true });
    await renderToFile(
        React.createElement(CorporateTaxInvoiceTemplate, {
            data,
        }) as Parameters<typeof renderToFile>[0],
        outputPath
    );
    await renderToFile(
        React.createElement(CorporateTaxInvoiceTemplate, {
            data: {
                ...data,
                order: {
                    ...data.order,
                    balanceDuePaise: 0,
                },
            },
        }) as Parameters<typeof renderToFile>[0],
        fullPaymentOutputPath
    );

    console.log(outputPath);
    console.log(fullPaymentOutputPath);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
