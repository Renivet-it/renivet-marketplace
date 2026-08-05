import {
    InvoiceTemplate,
    type InvoiceOrder,
} from "@/components/pdf/invoice-template";
import {
    corporateDocumentNumber,
    corporateReceiptVoucherNumber,
    RENIVET_CORPORATE_SELLER_NAME,
    RENIVET_CORPORATE_SIGNATORY,
} from "@/lib/corporate-documents";
import React from "react";

const renivetLogoUrl =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNul0Kj0hnjfTvXWe4YdlSzoaZPyC7xGVghIDL";

export type CorporateTaxInvoiceData = {
    invoice: {
        invoiceNumber: string;
        invoiceDate?: string | Date | null;
        taxableValuePaise: number;
        cgstPaise: number;
        sgstPaise: number;
        igstPaise: number;
        totalAmountPaise: number;
        dueDate?: string | Date | null;
        eWayBillNumber?: string | null;
        receiptVoucherNumber?: string | null;
    };
    order: {
        sequenceNo: number;
        publicOrderId: string;
        createdAt?: string | Date | null;
        companyName: string;
        gstNumber?: string | null;
        deliveryAddress: string;
        deliveryCity: string;
        deliveryPincode: string;
        deliveryCountry: string;
        quantity: number;
        subtotalPaise: number;
        customizationPaise: number;
        gstRateBps: number;
        advancePercentBps: number;
        advancePaidPaise: number;
        balanceDuePaise: number;
        paymentMethod?: string | null;
        paymentId?: string | null;
        eWayBillNumber?: string | null;
        productConfigSnapshot?: Record<string, any> | null;
        pricingSnapshot?: Record<string, any> | null;
    };
    seller: {
        name: string;
        logoUrl?: string | null;
        email?: string | null;
        phone?: string | null;
        gstin?: string | null;
        cin?: string | null;
        address: string;
        addressLine1?: string | null;
        addressLine2?: string | null;
        city?: string | null;
        state?: string | null;
        postalCode?: string | null;
        country?: string | null;
        bankName?: string | null;
        bankAccountHolderName?: string | null;
        bankAccountNumber?: string | null;
        bankAccountType?: string | null;
        bankIfscCode?: string | null;
        bankBranch?: string | null;
        authorizedSignatoryName?: string | null;
    };
    buyer: {
        companyName: string;
        gstNumber?: string | null;
        billingAddress: string;
        placeOfSupply?: string | null;
    };
    purchaseOrder?: {
        poNumber: string;
        poDate?: string | Date | null;
    } | null;
    product?: {
        title: string;
        sku?: string | null;
        hsn?: string | null;
    } | null;
    qrCodeDataUrl?: string;
};

function placeOfSupplyState(value?: string | null) {
    return value?.replace(/\s*\(\d{2}\)\s*$/, "").trim() || undefined;
}

export function CorporateTaxInvoiceTemplate({
    data,
}: {
    data: CorporateTaxInvoiceData;
}) {
    const { invoice, order, seller, buyer, purchaseOrder, product } = data;
    const corporateInvoicePayeeName = RENIVET_CORPORATE_SELLER_NAME;
    const productSnapshot = order.productConfigSnapshot ?? {};
    const pricingSnapshot = order.pricingSnapshot ?? {};
    const productName =
        product?.title ??
        productSnapshot.productType?.name ??
        productSnapshot.productScopeSummary ??
        "Corporate merchandise";
    const description =
        order.customizationPaise > 0
            ? `${productName} | Customization included`
            : productName;
    const quantity = Math.max(1, order.quantity);
    const totalPaise = invoice.totalAmountPaise;
    const balanceDuePaise = Math.min(
        totalPaise,
        Math.max(0, order.balanceDuePaise)
    );
    const paidAmountPaise = Math.max(0, totalPaise - balanceDuePaise);
    const paymentPercentBps = totalPaise
        ? Math.round((paidAmountPaise * 10_000) / totalPaise)
        : 0;
    const discountPaise = Math.max(
        0,
        Number(pricingSnapshot.discountPaise ?? 0)
    );
    const mrpPaise = invoice.taxableValuePaise + discountPaise;
    const invoiceDate = invoice.invoiceDate ?? new Date();
    const balanceDueDate = invoice.dueDate
        ? new Date(invoice.dueDate)
        : new Date(invoiceDate);
    if (!invoice.dueDate) balanceDueDate.setDate(balanceDueDate.getDate() + 15);
    const invoiceNumber = invoice.invoiceNumber.startsWith("CINV/")
        ? invoice.invoiceNumber
        : corporateDocumentNumber(
              "CINV",
              order.sequenceNo,
              invoice.invoiceDate ?? new Date()
          );
    const receiptVoucherNumber =
        invoice.receiptVoucherNumber ??
        (paidAmountPaise > 0
            ? corporateReceiptVoucherNumber(
                  order.sequenceNo,
                  order.createdAt ?? invoiceDate
              )
            : null);

    const invoiceOrder: InvoiceOrder = {
        id: order.publicOrderId,
        receiptId: order.publicOrderId,
        invoiceNumber,
        paymentMethod: order.paymentMethod ?? "prepaid",
        paymentId: order.paymentId ?? "Not available",
        date: invoiceDate,
        orderDate: order.createdAt ?? invoice.invoiceDate ?? new Date(),
        customerName: buyer.companyName,
        address: buyer.billingAddress,
        state: placeOfSupplyState(buyer.placeOfSupply),
        amount: totalPaise,
        deliveryAmount: 0,
        customerGstin: buyer.gstNumber,
        copyType: "original",
        qrCodeDataUrl: data.qrCodeDataUrl,
        poReference: purchaseOrder?.poNumber,
        poDate: purchaseOrder?.poDate,
        receiptVoucherNumber,
        balanceDueDate: balanceDuePaise > 0 ? balanceDueDate : null,
        eWayBillNumber: invoice.eWayBillNumber ?? order.eWayBillNumber,
        displayUnitPricing: true,
        declarationCompanyName: corporateInvoicePayeeName,
        sellerOfRecord: true,
        paymentSummary: {
            paymentStatus:
                paidAmountPaise <= 0
                    ? "unpaid"
                    : balanceDuePaise > 0
                      ? "partially_paid"
                      : "paid_in_full",
            paymentPercentBps,
            paidAmountPaise,
            fullPaymentAmountPaise: invoice.totalAmountPaise,
            balanceDuePaise,
        },
        taxSummary: {
            taxableValuePaise: invoice.taxableValuePaise,
            cgstPaise: invoice.cgstPaise,
            sgstPaise: invoice.sgstPaise,
            igstPaise: invoice.igstPaise,
            totalAmountPaise: invoice.totalAmountPaise,
        },
        items: [
            {
                quantity,
                gstRateBps: order.gstRateBps,
                mrpPaise,
                discountPaise,
                taxableValuePaise: invoice.taxableValuePaise,
                cgstPaise: invoice.cgstPaise,
                sgstPaise: invoice.sgstPaise,
                igstPaise: invoice.igstPaise,
                totalPaise,
                product: {
                    title: description,
                    price: Math.round(totalPaise / quantity),
                    compareAtPrice: Math.round(mrpPaise / quantity),
                    hsCode: product?.hsn,
                    sku: product?.sku,
                },
            },
        ],
        brand: {
            name: RENIVET_CORPORATE_SELLER_NAME,
            logoUrl: renivetLogoUrl,
            confidential: {
                addressLine1: seller.addressLine1 ?? seller.address,
                addressLine2: seller.addressLine2 ?? undefined,
                city: seller.city ?? undefined,
                state: seller.state ?? undefined,
                postalCode: seller.postalCode ?? undefined,
                gstin: seller.gstin ?? undefined,
                cin: seller.cin ?? undefined,
                email: "contact@renivet.com",
                phone: seller.phone ?? undefined,
                bankName: seller.bankName ?? undefined,
                bankAccountHolderName: corporateInvoicePayeeName,
                bankAccountNumber: seller.bankAccountNumber ?? undefined,
                bankAccountType: seller.bankAccountType ?? undefined,
                bankIfscCode: seller.bankIfscCode ?? undefined,
                bankBranch: seller.bankBranch ?? undefined,
                authorizedSignatoryName: RENIVET_CORPORATE_SIGNATORY,
            },
        },
    };

    return <InvoiceTemplate order={invoiceOrder} />;
}
