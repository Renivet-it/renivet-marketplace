# REN-217 — Database-driven dynamic sitemap

Replace the four-entry sitemap with read-only database-backed URLs for live products, collections, blogs, brands, static pages, home, shop, festive, and swap-passport. Preserve current category URL format until migration. Check total URL count before deciding whether sharding is needed.

Validation covers live-state filtering, timestamps/priorities, automatic updates, URL count, and sitemap XML output.
