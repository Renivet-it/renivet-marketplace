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
        authorizedSignatoryImageUrl?: string | null;
        isSameAsWarehouseAddress?: boolean | null;
        warehouseAddressLine1?: string | null;
        warehouseAddressLine2?: string | null;
        warehouseCity?: string | null;
        warehouseState?: string | null;
        warehousePostalCode?: string | null;
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
    const hsnCode =
        product?.hsn ??
        (typeof productSnapshot.hsnCode === "string"
            ? productSnapshot.hsnCode
            : undefined) ??
        (typeof (order as any).hsnCode === "string"
            ? (order as any).hsnCode
            : undefined) ??
        (typeof (order as any).quote?.hsnCode === "string"
            ? (order as any).quote.hsnCode
            : "6109");
    const extraChargesList =
        Array.isArray(pricingSnapshot.appliedExtraCharges) &&
        pricingSnapshot.appliedExtraCharges.length > 0
            ? ` | Extras: ${pricingSnapshot.appliedExtraCharges.map((e: any) => e.name || e.code).join(", ")}`
            : order.customizationPaise > 0
              ? " | Customization & Extras included"
              : "";
    const description = `${productName}${extraChargesList}`;
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
    const invoiceNumber = invoice.invoiceNumber;
    const receiptVoucherNumber =
        invoice.receiptVoucherNumber ??
        (paidAmountPaise > 0
            ? corporateReceiptVoucherNumber(
                  order.sequenceNo,
                  order.createdAt ?? invoiceDate
              )
            : null);

    const intra = invoice.igstPaise === 0;
    const customizationPaise = Math.max(
        0,
        Number(order.customizationPaise ?? 0)
    );
    const hasCustomization = customizationPaise > 0;
    const customizationRows = Array.isArray(
        (order.pricingSnapshot as any)?.customizations
    )
        ? (order.pricingSnapshot as any).customizations
        : [];
    const baseTaxablePaise = hasCustomization
        ? Math.max(0, invoice.taxableValuePaise - customizationPaise)
        : invoice.taxableValuePaise;

    const baseGstRateBps = order.gstRateBps;

    const baseGstPaise = Math.round(
        (baseTaxablePaise * baseGstRateBps) / 10_000
    );
    const baseCgstPaise = intra ? Math.round(baseGstPaise / 2) : 0;
    const baseSgstPaise = intra ? baseGstPaise - baseCgstPaise : 0;
    const baseIgstPaise = intra ? 0 : baseGstPaise;
    const baseTotalPaise = baseTaxablePaise + baseGstPaise;

    const customGstPaise = hasCustomization
        ? Number(
              (order.pricingSnapshot as any)?.customizationGstAmountPaise ??
                  invoice.cgstPaise +
                      invoice.sgstPaise +
                      invoice.igstPaise -
                      baseGstPaise
          )
        : 0;
    const customizationGstRateBps = Number(
        (order.pricingSnapshot as any)?.customizationGstRateBps ?? 0
    );
    const customCgstPaise = intra ? Math.round(customGstPaise / 2) : 0;
    const customSgstPaise = intra ? customGstPaise - customCgstPaise : 0;
    const customIgstPaise = intra ? 0 : customGstPaise;
    const customTotalPaise = customizationPaise + customGstPaise;

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
        taxDisplay: "standard",
        declarationCompanyName: seller.name,
        sellerOfRecord: false,
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
        customizationSummary: hasCustomization
            ? {
                  customizationPaise,
                  customizationGstPaise: customGstPaise,
                  customizationGstRateBps,
                  label:
                      customizationRows.length > 0
                          ? customizationRows
                                .map((row: any) => row.type || row.name)
                                .filter(Boolean)
                                .join(", ")
                          : "Customization / Extras",
              }
            : null,
        taxSummary: {
            taxableValuePaise: baseTaxablePaise,
            cgstPaise: baseCgstPaise,
            sgstPaise: baseSgstPaise,
            igstPaise: baseIgstPaise,
            totalAmountPaise: invoice.totalAmountPaise,
        },
        items: [
            {
                quantity,
                gstRateBps: baseGstRateBps,
                mrpPaise: baseTaxablePaise + discountPaise,
                discountPaise,
                taxableValuePaise: baseTaxablePaise,
                cgstPaise: baseCgstPaise,
                sgstPaise: baseSgstPaise,
                igstPaise: baseIgstPaise,
                totalPaise: baseTotalPaise,
                product: {
                    title: productName,
                    price: Math.round(baseTaxablePaise / quantity),
                    compareAtPrice: Math.round(
                        (baseTaxablePaise + discountPaise) / quantity
                    ),
                    hsCode: hsnCode,
                    sku: product?.sku,
                },
            },
            ...(hasCustomization
                ? [
                      {
                          quantity: 1,
                          gstRateBps: 1800,
                          mrpPaise: customizationPaise,
                          taxableValuePaise: customizationPaise,
                          cgstPaise: customCgstPaise,
                          sgstPaise: customSgstPaise,
                          igstPaise: customIgstPaise,
                          totalPaise: customTotalPaise,
                          product: {
                              title: "Customization / Extras",
                              price: customizationPaise,
                              hsCode: hsnCode,
                          },
                      },
                  ]
                : []),
        ],
        brand: {
            name: seller.name,
            logoUrl: seller.logoUrl || renivetLogoUrl,
            confidential: {
                addressLine1: seller.addressLine1 ?? seller.address,
                addressLine2: seller.addressLine2 ?? undefined,
                city: seller.city ?? undefined,
                state: seller.state ?? undefined,
                postalCode: seller.postalCode ?? undefined,
                gstin: seller.gstin ?? undefined,
                cin: seller.cin ?? undefined,
                email: seller.email ?? "contact@renivet.com",
                phone: seller.phone ?? undefined,
                bankName: seller.bankName ?? undefined,
                bankAccountHolderName:
                    seller.bankAccountHolderName ??
                    "Renivet Marketplace Pvt Ltd",
                bankAccountNumber: seller.bankAccountNumber ?? undefined,
                bankAccountType: seller.bankAccountType ?? undefined,
                bankIfscCode: seller.bankIfscCode ?? undefined,
                bankBranch: seller.bankBranch ?? undefined,
                authorizedSignatoryName:
                    seller.authorizedSignatoryName || seller.name,
                isSameAsWarehouseAddress:
                    seller.isSameAsWarehouseAddress ?? true,
                warehouseAddressLine1:
                    seller.warehouseAddressLine1 ?? undefined,
                warehouseAddressLine2:
                    seller.warehouseAddressLine2 ?? undefined,
                warehouseCity: seller.warehouseCity ?? undefined,
                warehouseState: seller.warehouseState ?? undefined,
                warehousePostalCode: seller.warehousePostalCode ?? undefined,
            },
        },
    };

    return <InvoiceTemplate order={invoiceOrder} />;
}
