CREATE INDEX IF NOT EXISTS "product_fts_idx" ON "products" USING gin ((
            setweight(to_tsvector('english', "title"), 'A') ||
            setweight(to_tsvector('english', "description"), 'B')
        ));