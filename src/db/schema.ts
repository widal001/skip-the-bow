import {
  integer,
  serial,
  pgTable,
  text,
  real,
  primaryKey,
  timestamp,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// #########################################################
// Users
// #########################################################

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// #########################################################
// Gifts
// #########################################################

export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  minPrice: real("min_price").notNull(),
  maxPrice: real("max_price").notNull(),
  link: text("link").notNull(),
  isHidden: boolean("is_hidden").notNull().default(false),
  category: text("category", {
    enum: ["donation", "subscription", "experience", "giftcard", "other"],
  }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// #########################################################
// Tags
// #########################################################

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const giftTags = pgTable(
  "gift_tags",
  {
    giftId: integer("gift_id")
      .notNull()
      .references(() => gifts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.giftId, table.tagId] })]
);

export const giftsRelations = relations(gifts, ({ many }) => ({
  giftTags: many(giftTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  giftTags: many(giftTags),
}));

export const giftTagsRelations = relations(giftTags, ({ one }) => ({
  gift: one(gifts, {
    fields: [giftTags.giftId],
    references: [gifts.id],
  }),
  tag: one(tags, {
    fields: [giftTags.tagId],
    references: [tags.id],
  }),
}));

// #########################################################
// Wishlists
// #########################################################

export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const wishlistsRelations = relations(wishlists, ({ many }) => ({
  wishlistItems: many(wishlistItems),
}));

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    wishlistId: integer("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    giftId: integer("gift_id")
      .notNull()
      .references(() => gifts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.wishlistId, table.giftId] })]
);

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  wishlist: one(wishlists, {
    fields: [wishlistItems.wishlistId],
    references: [wishlists.id],
  }),
  gift: one(gifts, {
    fields: [wishlistItems.giftId],
    references: [gifts.id],
  }),
}));

// #########################################################
// Bookmarks
// #########################################################

export const bookmarks = pgTable(
  "bookmarks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    giftId: integer("gift_id")
      .notNull()
      .references(() => gifts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.giftId] })]
);

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  gift: one(gifts, {
    fields: [bookmarks.giftId],
    references: [gifts.id],
  }),
}));

// #########################################################
// Inferred types
// #########################################################

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Gift = typeof gifts.$inferSelect;
export type NewGift = typeof gifts.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type GiftTag = typeof giftTags.$inferSelect;
export type NewGiftTag = typeof giftTags.$inferInsert;
export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
