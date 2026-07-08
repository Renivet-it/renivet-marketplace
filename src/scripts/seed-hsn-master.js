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

const HSN_ROWS = [
    {
        hsn_code: "61091000",
        description: "Cotton T-shirts, knitted or crocheted",
        gst_rate_bps: 500,
        category_label: "apparel",
    },
    {
        hsn_code: "62044300",
        description: "Women's dresses of synthetic fibres",
        gst_rate_bps: 1200,
        category_label: "apparel",
    },
    {
        hsn_code: "42022220",
        description: "Handbags and totes",
        gst_rate_bps: 1800,
        category_label: "bags",
    },
    {
        hsn_code: "33049990",
        description: "Personal care and beauty preparations",
        gst_rate_bps: 1800,
        category_label: "personal_care",
    },
    {
        hsn_code: "49019900",
        description: "Printed books and similar reading material",
        gst_rate_bps: 0,
        category_label: "books",
    },
];

async function main() {
    for (const row of HSN_ROWS) {
        await sql`
            insert into hsn_master (
                hsn_code,
                description,
                gst_rate_bps,
                category_label,
                is_active,
                metadata,
                created_at,
                updated_at
            ) values (
                ${row.hsn_code},
                ${row.description},
                ${row.gst_rate_bps},
                ${row.category_label},
                true,
                '{}'::jsonb,
                now(),
                now()
            )
            on conflict (hsn_code) do update
            set
                description = excluded.description,
                gst_rate_bps = excluded.gst_rate_bps,
                category_label = excluded.category_label,
                is_active = true,
                updated_at = now()
        `;
    }

    console.log(`Seeded ${HSN_ROWS.length} HSN master rows.`);
}

main()
    .catch((error) => {
        console.error("Failed to seed HSN master rows.");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sql.end({ timeout: 5 });
    });
