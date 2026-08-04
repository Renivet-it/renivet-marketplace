import {
    InvoiceTemplate,
    type InvoiceOrder,
} from "@/components/pdf/invoice-template";

export type CorporateTaxInvoiceData = {
    invoice: {
        invoiceNumber: string;
        invoiceDate?: string | Date | null;
        taxableValuePaise: number;
        cgstPaise: number;
        sgstPaise: number;
        igstPaise: number;
        totalAmountPaise: number;
    };
    order: {
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
    const discountPaise = Math.max(
        0,
        Number(pricingSnapshot.discountPaise ?? 0)
    );
    const mrpPaise = invoice.taxableValuePaise + discountPaise;

    const invoiceOrder: InvoiceOrder = {
        id: order.publicOrderId,
        receiptId: order.publicOrderId,
        invoiceNumber: invoice.invoiceNumber,
        paymentMethod: order.paymentMethod ?? "prepaid",
        paymentId: order.paymentId ?? "Not available",
        date: invoice.invoiceDate ?? new Date(),
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
        displayUnitPricing: true,
        paymentSummary: {
            partialPaymentPercentBps: order.advancePercentBps,
            partialPaymentRequiredPaise: Math.round(
                (invoice.totalAmountPaise * order.advancePercentBps) / 10_000
            ),
            fullPaymentAmountPaise: invoice.totalAmountPaise,
            balanceAfterPartialPaise: Math.max(
                0,
                invoice.totalAmountPaise -
                    Math.round(
                        (invoice.totalAmountPaise * order.advancePercentBps) /
                            10_000
                    )
            ),
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
            name: seller.name,
            logoUrl: seller.logoUrl,
            confidential: {
                addressLine1: seller.addressLine1 ?? seller.address,
                addressLine2: seller.addressLine2 ?? undefined,
                city: seller.city ?? undefined,
                state: seller.state ?? undefined,
                postalCode: seller.postalCode ?? undefined,
                gstin: seller.gstin ?? undefined,
                cin: seller.cin ?? undefined,
                email: seller.email ?? undefined,
                phone: seller.phone ?? undefined,
                bankName: seller.bankName ?? undefined,
                bankAccountHolderName:
                    seller.bankAccountHolderName ?? seller.name,
                bankAccountNumber: seller.bankAccountNumber ?? undefined,
                bankAccountType: seller.bankAccountType ?? undefined,
                bankIfscCode: seller.bankIfscCode ?? undefined,
                bankBranch: seller.bankBranch ?? undefined,
                authorizedSignatoryName:
                    seller.authorizedSignatoryName ?? undefined,
            },
        },
    };

    return <InvoiceTemplate order={invoiceOrder} />;
}
