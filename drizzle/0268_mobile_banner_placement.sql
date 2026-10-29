ALTER TABLE "home_banners" ADD COLUMN "is_mobile" boolean DEFAULT false NOT NULL;

INSERT INTO "home_banners" ("title", "description", "image_url", "url", "is_active", "is_mobile", "created_at", "updated_at") VALUES
	('Swap Passport', 'Mobile homepage banner', 'https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN8o5y85jj1qpSPZJEOTHVgaenl2yArM78zCkm', 'https://renivet.com/swap-passport', true, true, now() - interval '6 seconds', now()),
	('My Mithila', 'Mobile homepage banner', 'https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNoDD6Uqn0WvnGEidmOVIP6xXt4S7befYUykMJ', 'https://renivet.com/brands/my-mithila/shop', true, true, now() - interval '5 seconds', now()),
	('Terra Luna', 'Mobile homepage banner', 'https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNLFBC2sVUt5ndSiE7wT2jaklrZXQ6vYpAbfHy', 'https://renivet.com/brands/terra-luna/shop', true, true, now() - interval '4 seconds', now()),
	('Bamboology', 'Mobile homepage banner', 'https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNKIsQTDoXWY4M9GmONJv38rnKquVZUx0pjkQE', 'https://renivet.com/brands/bamboology/shop', true, true, now() - interval '3 seconds', now()),
	('Beauty and Personal Care', 'Mobile homepage banner', 'https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNHKdd5g0rgXZuWwadPABUqnljV5RbJMFsx1v', '/shop/beauty-and-personal-care?sortBy=best-sellers', true, true, now() - interval '2 seconds', now()),
	('Greysome', 'Mobile homepage banner', 'https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNIG3sMyLrApCnKbtW0hkXs6adUVPBQFlvOi2M', 'https://renivet.com/brands/greysome/shop', true, true, now() - interval '1 second', now());
