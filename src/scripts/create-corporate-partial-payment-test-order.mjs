import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

const sql = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    idle_timeout: 5,
    connect_timeout: 10,
});

const publicOrderId = "REN-CORP-TEST-30PCT-20X20";
const preferredUserId =
    process.env.TEST_CORPORATE_USER_ID ?? "user_2up0RXKnR2zVhppFOKnzJR7A1xd";

try {
    const existing = await sql`
        SELECT id, public_order_id, total_paise, advance_paid_paise, balance_due_paise
        FROM corporate_orders
        WHERE public_order_id = ${publicOrderId}
        LIMIT 1
    `;

    if (existing[0]) {
        await sql.begin(async (tx) => {
            await tx`
                UPDATE corporate_orders
                SET subtotal_paise = 38095,
                    gst_number = '19AAECT1234G1Z7',
                    gst_rate_bps = 500,
                    gst_paise = 1905,
                    pricing_snapshot = pricing_snapshot || ${tx.json({
                        subtotalPaise: 38095,
                        gstRateBps: 500,
                        gstPaise: 1905,
                    })},
                    updated_at = NOW()
                WHERE id = ${existing[0].id}
            `;
            await tx`
                UPDATE corporate_tax_invoices
                SET taxable_value_paise = 38095,
                    cgst_paise = 0,
                    sgst_paise = 0,
                    igst_paise = 1905,
                    updated_at = NOW()
                WHERE order_id = ${existing[0].id}
            `;
        });
        console.log(
            JSON.stringify({ created: false, order: existing[0] }, null, 2)
        );
        process.exitCode = 0;
    } else {
        const preferredUsers = await sql`
            SELECT id, first_name, last_name, email, phone
            FROM users
            WHERE id = ${preferredUserId}
            LIMIT 1
        `;
        const fallbackUsers = preferredUsers.length
            ? preferredUsers
            : await sql`
                  SELECT id, first_name, last_name, email, phone
                  FROM users
                  ORDER BY created_at DESC
                  LIMIT 1
              `;
        const user = fallbackUsers[0];
        if (!user)
            throw new Error("No user exists for the test corporate order");

        const sellers = await sql`
            SELECT b.id, b.name
            FROM brands b
            INNER JOIN brand_confidentials bc ON bc.id = b.id
            WHERE b.is_active = true
            ORDER BY b.created_at ASC
            LIMIT 1
        `;
        const seller = sellers[0];
        if (!seller) {
            throw new Error(
                "No active brand with confidential invoice details is available"
            );
        }

        const result = await sql.begin(async (tx) => {
            const employeeRows = Array.from({ length: 20 }, (_, index) => ({
                employeeName: `Test Employee ${index + 1}`,
                size: "M",
            }));
            const companySnapshot = {
                companyName: "Renivet Corporate Invoice Test",
                contactPersonName:
                    `${user.first_name} ${user.last_name}`.trim(),
                emailAddress: user.email,
                mobileNumber: user.phone ?? "9999999999",
                deliveryCountry: "India",
                deliveryCity: "Kolkata",
                deliveryPincode: "700001",
                deliveryAddress: "Test Corporate Billing Address",
                numberOfEmployees: 20,
            };
            const productConfigSnapshot = {
                productType: { name: "Corporate Cotton T-Shirt" },
                productScopeSummary: "20 Corporate Cotton T-Shirts",
                quantity: 20,
                unitPricePaise: 2000,
                color: "White",
                size: "M",
            };
            const brandingConfigSnapshot = {
                paymentPreference: "partial_advance",
                customization: "None",
            };
            const pricingSnapshot = {
                unitPricePaise: 2000,
                subtotalPaise: 38095,
                customizationPaise: 0,
                gstRateBps: 500,
                gstPaise: 1905,
                totalPaise: 40000,
                advancePercentBps: 3000,
                advancePaidPaise: 12000,
                balanceDuePaise: 28000,
            };

            const orders = await tx`
                INSERT INTO corporate_orders (
                    public_order_id,
                    user_id,
                    brand_id,
                    status,
                    payment_status,
                    company_name,
                    contact_person_name,
                    email_address,
                    mobile_number,
                    gst_number,
                    delivery_country,
                    delivery_city,
                    delivery_pincode,
                    delivery_address,
                    number_of_employees,
                    employee_count,
                    quantity,
                    size_breakdown,
                    employee_rows,
                    company_snapshot,
                    product_config_snapshot,
                    branding_config_snapshot,
                    pricing_snapshot,
                    artwork_file,
                    employee_sheet_file,
                    subtotal_paise,
                    customization_paise,
                    gst_rate_bps,
                    gst_paise,
                    total_paise,
                    advance_percent_bps,
                    advance_paid_paise,
                    balance_due_paise,
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                    payment_reference,
                    balance_payment_status,
                    customer_notes,
                    internal_notes
                ) VALUES (
                    ${publicOrderId},
                    ${user.id},
                    ${seller.id},
                    'inquiry_received',
                    'pending',
                    'Renivet Corporate Invoice Test',
                    ${`${user.first_name} ${user.last_name}`.trim()},
                    ${user.email},
                    ${user.phone ?? "9999999999"},
                    '19AAECT1234G1Z7',
                    'India',
                    'Kolkata',
                    '700001',
                    'Test Corporate Billing Address',
                    20,
                    20,
                    20,
                    ${tx.json({ M: 20 })},
                    ${tx.json(employeeRows)},
                    ${tx.json(companySnapshot)},
                    ${tx.json(productConfigSnapshot)},
                    ${tx.json(brandingConfigSnapshot)},
                    ${tx.json(pricingSnapshot)},
                    NULL,
                    NULL,
                    38095,
                    0,
                    500,
                    1905,
                    40000,
                    3000,
                    12000,
                    28000,
                    'TEST-RZP-ORDER-30PCT-20X20',
                    'TEST-RZP-PAYMENT-30PCT-20X20',
                    'TEST-NO-EXTERNAL-PAYMENT',
                    'TEST-RZP-PAYMENT-30PCT-20X20',
                    'pending',
                    'Test order for partial and full corporate invoice validation.',
                    'Created directly by the no-notification corporate invoice test seed.'
                )
                RETURNING id, sequence_no, public_order_id, total_paise,
                          advance_paid_paise, balance_due_paise
            `;
            const order = orders[0];

            await tx`
                INSERT INTO corporate_order_status_history (
                    corporate_order_id,
                    from_status,
                    to_status,
                    changed_by_user_id,
                    note,
                    metadata
                ) VALUES (
                    ${order.id},
                    NULL,
                    'inquiry_received',
                    ${user.id},
                    '30% partial payment recorded for invoice testing',
                    ${tx.json({
                        paymentKind: "partial",
                        notificationSent: false,
                    })}
                )
            `;

            await tx`
                INSERT INTO corporate_payments (
                    order_id,
                    payment_type,
                    payment_mode,
                    amount_paise,
                    payment_reference,
                    payment_status,
                    payment_date,
                    metadata
                ) VALUES (
                    ${order.id},
                    'partial',
                    'manual',
                    12000,
                    'TEST-RZP-PAYMENT-30PCT-20X20',
                    'payment_partial',
                    CURRENT_DATE,
                    ${tx.json({
                        percentageBps: 3000,
                        testPayment: true,
                        notificationSent: false,
                    })}
                )
            `;

            await tx`
                INSERT INTO corporate_purchase_orders (
                    po_number,
                    corporate_order_id,
                    company_name,
                    po_value_paise,
                    po_date,
                    product_scope_summary,
                    authorized_signatory_name,
                    authorized_signatory_confirmed,
                    validation_issues,
                    status,
                    review_notes
                ) VALUES (
                    'PO-TEST-30PCT-20X20',
                    ${order.id},
                    'Renivet Corporate Invoice Test',
                    40000,
                    CURRENT_DATE,
                    '20 Corporate Cotton T-Shirts at Rs 20 each',
                    ${`${user.first_name} ${user.last_name}`.trim()},
                    true,
                    ${tx.json([])},
                    'po_accepted',
                    'Test purchase order; no external notification was sent.'
                )
            `;

            const invoiceCount = await tx`
                SELECT COUNT(*)::integer AS count
                FROM corporate_tax_invoices
            `;
            const invoiceNumber = `TI-${String(
                (invoiceCount[0]?.count ?? 0) + 1
            ).padStart(5, "0")}`;
            await tx`
                INSERT INTO corporate_tax_invoices (
                    invoice_number,
                    order_id,
                    invoice_date,
                    taxable_value_paise,
                    cgst_paise,
                    sgst_paise,
                    igst_paise,
                    total_amount_paise,
                    status
                ) VALUES (
                    ${invoiceNumber},
                    ${order.id},
                    CURRENT_DATE,
                    38095,
                    0,
                    0,
                    1905,
                    40000,
                    'issued'
                )
            `;

            return {
                ...order,
                invoice_number: invoiceNumber,
                user_id: user.id,
                user_email: user.email,
                seller_brand: seller.name,
            };
        });

        console.log(JSON.stringify({ created: true, order: result }, null, 2));
    }
} finally {
    await sql.end({ timeout: 5 });
}
