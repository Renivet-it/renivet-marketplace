DO $$
DECLARE
    duplicate_quotes text;
BEGIN
    SELECT string_agg(quote_id::text, ', ' ORDER BY quote_id)
    INTO duplicate_quotes
    FROM (
        SELECT quote_id
        FROM corporate_purchase_orders
        WHERE quote_id IS NOT NULL
        GROUP BY quote_id
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_quotes IS NOT NULL THEN
        RAISE EXCEPTION
            'REN-265 migration blocked: duplicate corporate purchase orders exist for quote IDs: %',
            duplicate_quotes;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS corporate_purchase_orders_quote_unique
    ON corporate_purchase_orders (quote_id)
    WHERE quote_id IS NOT NULL;
