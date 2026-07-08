const path = require("path");
const dotenv = require("dotenv");
const postgres = require("postgres");

dotenv.config({
    path: path.join(process.cwd(), ".env.local"),
});

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from .env.local");
}

const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
});

function buildIds() {
    const stamp = Date.now();
    return {
        orderId: `TEST-REFUND-${stamp}`,
        receiptId: `RCPT-TEST-REFUND-${stamp}`,
        paymentId: `pay_test_refund_${stamp}`,
        trackingNumber: `TRKTEST${stamp}`,
        awbNumber: `AWBTEST${stamp}`,
    };
}

async function main() {
    const ids = buildIds();
    const deliveredAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const createdAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const candidate = await sql`
        select
            u.id as user_id,
            a.id as address_id,
            p.id as product_id,
            p.brand_id as brand_id,
            coalesce(nullif(p.price, 0), 149900) as price,
            p.sku as sku
        from users u
        inner join addresses a on a.user_id = u.id
        inner join products p on p.is_active = true
            and p.is_published = true
            and coalesce(p.is_deleted, false) = false
        order by u.created_at asc, p.created_at asc
        limit 1
    `;

    if (!candidate.length) {
        throw new Error("No user/address/product combination was found for creating a test order.");
    }

    const row = candidate[0];

    await sql.begin(async (tx) => {
        await tx`
            insert into orders (
                id,
                user_id,
                receipt_id,
                payment_id,
                payment_method,
                payment_status,
                status,
                address_id,
                total_items,
                tax_amount,
                delivery_amount,
                discount_amount,
                total_amount,
                created_at,
                updated_at
            ) values (
                ${ids.orderId},
                ${row.user_id},
                ${ids.receiptId},
                ${ids.paymentId},
                'razorpay',
                'paid',
                'delivered',
                ${row.address_id},
                1,
                0,
                0,
                0,
                ${row.price},
                ${createdAt},
                ${deliveredAt}
            )
        `;

        await tx`
            insert into order_items (
                order_id,
                product_id,
                variant_id,
                sku,
                quantity,
                created_at,
                updated_at
            ) values (
                ${ids.orderId},
                ${row.product_id},
                null,
                ${row.sku},
                1,
                ${createdAt},
                ${deliveredAt}
            )
        `;

        await tx`
            insert into order_shipments (
                order_id,
                brand_id,
                courier_name,
                awb_number,
                tracking_number,
                status,
                shipment_date,
                estimated_delivery_date,
                is_pickup_scheduled,
                is_awb_generated,
                created_at,
                updated_at
            ) values (
                ${ids.orderId},
                ${row.brand_id},
                'Test Carrier',
                ${ids.awbNumber},
                ${ids.trackingNumber},
                'delivered',
                ${createdAt},
                ${deliveredAt},
                true,
                true,
                ${createdAt},
                ${deliveredAt}
            )
        `;
    });

    console.log(
        JSON.stringify(
            {
                ok: true,
                orderId: ids.orderId,
                receiptId: ids.receiptId,
                paymentId: ids.paymentId,
                note: "Refund creation and approval can be tested on this order. Razorpay refund execution will fail because the payment id is synthetic.",
            },
            null,
            2
        )
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sql.end({ timeout: 5 });
    });
