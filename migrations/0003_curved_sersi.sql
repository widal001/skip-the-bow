-- Step 1: Add new UUID columns
ALTER TABLE "wishlists" ADD COLUMN "id_new" uuid DEFAULT gen_random_uuid();
ALTER TABLE "wishlist_items" ADD COLUMN "wishlist_id_new" uuid;

-- Step 2: Generate UUIDs for existing wishlists and update wishlist_items
UPDATE "wishlists" SET "id_new" = gen_random_uuid() WHERE "id_new" IS NULL;
UPDATE "wishlist_items" SET "wishlist_id_new" = w."id_new" 
FROM "wishlists" w 
WHERE "wishlist_items"."wishlist_id" = w."id";

-- Step 3: Drop foreign key constraints
ALTER TABLE "wishlist_items" DROP CONSTRAINT IF EXISTS "wishlist_items_wishlist_id_wishlists_id_fk";

-- Step 4: Drop old columns and rename new ones
ALTER TABLE "wishlist_items" DROP COLUMN "wishlist_id";
ALTER TABLE "wishlist_items" RENAME COLUMN "wishlist_id_new" TO "wishlist_id";

ALTER TABLE "wishlists" DROP CONSTRAINT IF EXISTS "wishlists_pkey";
ALTER TABLE "wishlists" DROP COLUMN "id";
ALTER TABLE "wishlists" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "wishlists" ADD PRIMARY KEY ("id");

-- Step 5: Recreate foreign key constraint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_wishlists_id_fk" 
FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE cascade ON UPDATE no action;
