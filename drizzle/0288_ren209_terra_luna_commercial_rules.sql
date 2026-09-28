-- REN-209: provisional internal commercial configuration for Terra Luna only.
-- No other brand/category is populated. Source linkage is explicitly pending REN-208.
WITH terra_luna AS (
    SELECT id
    FROM brands
    WHERE lower(name) = 'terra luna'
    LIMIT 1
), fashion_categories AS (
    SELECT id
    FROM categories
    WHERE lower(name) IN ('fashion/clothing', 'fashion', 'clothing', 'women', 'men')
), personal_care_categories AS (
    SELECT id
    FROM categories
    WHERE lower(name) IN ('personal care', 'beauty and personal care')
)
INSERT INTO commission_rules (
    id,
    brand_id,
    category_id,
    rule_name,
    commission_percent_bps,
    holdback_percent_bps,
    priority,
    effective_from,
    is_active,
    metadata,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    terra_luna.id,
    fashion_categories.id,
    'Terra Luna Fashion/Clothing',
    2500,
    0,
    100,
    CURRENT_DATE,
    true,
    jsonb_build_object(
        'sourceStatus', 'no_source_document_on_file',
        'agreementVersionId', null,
        'approverName', 'Akshay',
        'provisional', true,
        'commissionBasis', 'Fashion/Clothing'
    ),
    now(),
    now()
FROM terra_luna
CROSS JOIN fashion_categories
WHERE NOT EXISTS (
    SELECT 1
    FROM commission_rules existing
    WHERE existing.brand_id = terra_luna.id
      AND existing.category_id = fashion_categories.id
      AND existing.rule_name = 'Terra Luna Fashion/Clothing'
)
UNION ALL
SELECT
    gen_random_uuid(),
    terra_luna.id,
    personal_care_categories.id,
    'Terra Luna Personal Care',
    2000,
    0,
    100,
    CURRENT_DATE,
    true,
    jsonb_build_object(
        'sourceStatus', 'no_source_document_on_file',
        'agreementVersionId', null,
        'approverName', 'Akshay',
        'provisional', true,
        'commissionBasis', 'Personal Care'
    ),
    now(),
    now()
FROM terra_luna
CROSS JOIN personal_care_categories
WHERE NOT EXISTS (
    SELECT 1
    FROM commission_rules existing
    WHERE existing.brand_id = terra_luna.id
      AND existing.category_id = personal_care_categories.id
      AND existing.rule_name = 'Terra Luna Personal Care'
);
