import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
    const [{ db }, schema, { eq }, documents] = await Promise.all([
        import("@/lib/db"),
        import("@/lib/db/schema"),
        import("drizzle-orm"),
        import("@/lib/services/corporate-documents"),
    ]);
    const existing = await db.query.corporateOrders.findFirst({
        where: eq(schema.corporateOrders.publicOrderId, "TEST-CORP-20X20-30"),
    });
    if (existing) {
        console.log(`Test order already exists: ${existing.id}`);
        return;
    }

    const requestedUserId = process.env.CORPORATE_TEST_USER_ID;
    const user = requestedUserId
        ? await db.query.users.findFirst({
              where: eq(schema.users.id, requestedUserId),
          })
        : await db.query.users.findFirst();
    const brand = await db.query.brands.findFirst({
        where: eq(schema.brands.isActive, true),
    });
    const product = await db.query.products.findFirst();
    if (!user || !brand) {
        throw new Error(
            "A user and an active brand are required. Set CORPORATE_TEST_USER_ID to choose the customer."
        );
    }

    const profile =
        (await db.query.corporateProfiles.findFirst({
            where: eq(schema.corporateProfiles.userId, user.id),
        })) ??
        (await db
            .insert(schema.corporateProfiles)
            .values({
                userId: user.id,
                companyName: "Renivet Corporate Test Company",
                contactPerson: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                phone: user.phone ?? "9999999999",
                billingAddress: {
                    addressLine1: "Test billing address",
                    city: "Kolkata",
                    state: "West Bengal",
                    postalCode: "700001",
                    country: "India",
                },
                shippingAddress: {
                    addressLine1: "Test delivery address",
                    city: "Kolkata",
                    state: "West Bengal",
                    postalCode: "700001",
                    country: "India",
                },
            })
            .returning()
            .then((rows) => rows[0]));
    if (!profile) throw new Error("Failed to resolve a corporate test profile");

    const quote = await db
        .insert(schema.corporateQuotes)
        .values({
            quoteNumber: `TEST-Q-${Date.now()}`,
            corporateProfileId: profile.id,
            brandId: brand.id,
            productId: product?.id ?? null,
            quantity: 20,
            subtotalPaise: 40_000,
            customizationCostPaise: 0,
            gstAmountPaise: 0,
            totalAmountPaise: 40_000,
            advanceAmountPaise: 12_000,
            balanceAmountPaise: 28_000,
            status: "approved",
        })
        .returning()
        .then((rows) => rows[0]);
    const proformaNumber = await documents.nextCorporateDocumentNumber("PI");
    await db.insert(schema.corporateProformaInvoices).values({
        invoiceNumber: proformaNumber,
        quoteId: quote.id,
        customerId: profile.id,
        invoiceDate: new Date().toISOString().slice(0, 10),
        subtotalPaise: 40_000,
        gstAmountPaise: 0,
        totalAmountPaise: 40_000,
        paymentTerms: "30% advance; remaining 70% due at dispatch.",
        termsAndConditions: "Test document - no notification was sent.",
        status: "issued",
    });

    const order = await db
        .insert(schema.corporateOrders)
        .values({
            publicOrderId: "TEST-CORP-20X20-30",
            userId: user.id,
            quoteId: quote.id,
            brandId: brand.id,
            status: "approved",
            paymentStatus: "pending",
            companyName: profile.companyName,
            contactPersonName: profile.contactPerson,
            emailAddress: profile.email,
            mobileNumber: profile.phone,
            gstNumber: profile.gstNumber,
            deliveryCountry: "India",
            deliveryCity: "Kolkata",
            deliveryPincode: "700001",
            deliveryAddress: "Test delivery address",
            numberOfEmployees: 20,
            employeeCount: 20,
            quantity: 20,
            sizeBreakdown: { M: 20 },
            employeeRows: [],
            companySnapshot: { companyName: profile.companyName },
            productConfigSnapshot: {
                productScopeSummary: "20 corporate T-shirts at INR 20 each",
                productTitle: product?.title ?? "Corporate T-shirt",
            },
            brandingConfigSnapshot: { paymentPreference: "partial_advance" },
            pricingSnapshot: {
                unitPricePaise: 2_000,
                subtotalPaise: 40_000,
                testOrder: true,
            },
            subtotalPaise: 40_000,
            customizationPaise: 0,
            gstRateBps: 0,
            gstPaise: 0,
            totalPaise: 40_000,
            advancePercentBps: 3_000,
            advancePaidPaise: 12_000,
            balanceDuePaise: 28_000,
            razorpayOrderId: "test_order_no_gateway_call",
            razorpayPaymentId: "test_payment_no_notification",
            paymentReference: "TEST-30-PERCENT",
            internalNotes:
                "Document-chain test: 20 T-shirts x INR 20, 30% paid. No notification sent.",
        })
        .returning()
        .then((rows) => rows[0]);

    await db.insert(schema.corporatePurchaseOrders).values({
        poNumber: "TEST-CUSTOMER-PO-20X20",
        corporateOrderId: order.id,
        quoteId: quote.id,
        corporateProfileId: profile.id,
        companyName: profile.companyName,
        poValuePaise: 40_000,
        poDate: new Date().toISOString().slice(0, 10),
        productScopeSummary: "20 corporate T-shirts at INR 20 each",
        authorizedSignatoryName: profile.contactPerson,
        authorizedSignatoryConfirmed: true,
        uploadedFileUrl: "https://example.invalid/test-corporate-po.pdf",
        status: "po_accepted",
        approvedByUserId: user.id,
        approvedAt: new Date().toISOString().slice(0, 10),
    });
    const payment = await db
        .insert(schema.corporatePayments)
        .values({
            orderId: order.id,
            quoteId: quote.id,
            paymentType: "advance",
            paymentMode: "manual",
            amountPaise: 12_000,
            paymentReference: "TEST-30-PERCENT",
            paymentStatus: "payment_partial",
            paymentDate: new Date().toISOString().slice(0, 10),
            metadata: { testOrder: true, notificationsSent: false },
        })
        .returning()
        .then((rows) => rows[0]);
    const receiptNumber = await documents.nextCorporateDocumentNumber("RV");
    await db.insert(schema.corporateReceiptVouchers).values({
        voucherNumber: receiptNumber,
        orderId: order.id,
        paymentId: payment.id,
        voucherDate: new Date().toISOString().slice(0, 10),
        amountPaise: 12_000,
        paymentMode: "manual",
        paymentReference: "TEST-30-PERCENT",
        poReference: "TEST-CUSTOMER-PO-20X20",
        status: "issued",
    });

    console.log(`Created test corporate order: ${order.id}`);
    console.log("Total INR 400.00; paid INR 120.00 (30%); balance INR 280.00");
    console.log(
        `Proforma: ${proformaNumber}; Receipt voucher: ${receiptNumber}`
    );
    console.log("No notification service was called.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
