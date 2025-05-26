import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

const toDate = (timestamp: number) => new Date(timestamp * 1000);
const fromDate = (date: Date) => Math.floor(date.getTime() / 1000);

const timestamp = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$type<Date>(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`)
    .$type<Date>(),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  ...timestamp,
});

export const gifts = sqliteTable("gifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  minPrice: real("min_price").notNull(),
  maxPrice: real("max_price").notNull(),
  link: text("link").notNull(),
  isHidden: integer("is_hidden", { mode: "boolean" }).notNull().default(false),
  category: text("category", {
    enum: ["donation", "subscription", "experience", "giftcard", "other"],
  }).notNull(),
  ...timestamp,
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  ...timestamp,
});

export const giftTags = sqliteTable(
  "gift_tags",
  {
    giftId: integer("gift_id")
      .notNull()
      .references(() => gifts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    ...timestamp,
  },
  (table) => [primaryKey({ columns: [table.giftId, table.tagId] })]
);

export const wishlists = sqliteTable("wishlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ...timestamp,
});

export const wishlistsRelations = relations(wishlists, ({ many }) => ({
  bookmarks: many(bookmarks),
}));

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    wishlistId: integer("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    giftId: integer("gift_id")
      .notNull()
      .references(() => gifts.id, { onDelete: "cascade" }),
    ...timestamp,
  },
  (table) => [primaryKey({ columns: [table.wishlistId, table.giftId] })]
);

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  wishlist: one(wishlists, {
    fields: [bookmarks.wishlistId],
    references: [wishlists.id],
  }),
  gift: one(gifts, {
    fields: [bookmarks.giftId],
    references: [gifts.id],
  }),
}));
