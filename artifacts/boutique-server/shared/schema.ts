import { pgTable, text, varchar, integer, boolean, real, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  images: text("images").array().notNull(),
  videoUrl: text("video_url"),
  sizes: text("sizes").array().notNull(),
  colors: text("colors").array().notNull(),
  fabricEn: text("fabric_en"),
  fabricAr: text("fabric_ar"),
  inStock: boolean("in_stock").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  badge: text("badge"),
  rating: real("rating").notNull().default(4.5),
  reviewCount: integer("review_count").notNull().default(0),
  arEnabled: boolean("ar_enabled").notNull().default(false),
  arAssetType: text("ar_asset_type"),
  arAssetUrl: text("ar_asset_url"),
  arScaleHint: real("ar_scale_hint"),
  arPlacementHint: text("ar_placement_hint"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  size: text("size").notNull(),
  color: text("color").notNull(),
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  addressEn: text("address_en").notNull(),
  addressAr: text("address_ar").notNull(),
  city: text("city").notNull(),
  phone: text("phone").notNull(),
  hoursEn: text("hours_en").notNull(),
  hoursAr: text("hours_ar").notNull(),
  mapUrl: text("map_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  items: jsonb("items").notNull(),
  subtotal: integer("subtotal").notNull(),
  shipping: integer("shipping").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  total: integer("total").notNull(),
  status: text("status").notNull().default("processing"),
  fulfillmentType: text("fulfillment_type").notNull().default("delivery"),
  pickupStoreId: integer("pickup_store_id"),
  pickupStoreName: text("pickup_store_name"),
  pickupAddress: text("pickup_address"),
  pickupHours: text("pickup_hours"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone").notNull(),
  shippingAddress: text("shipping_address").notNull().default(""),
  shippingCity: text("shipping_city").notNull().default(""),
  shippingCountry: text("shipping_country").notNull().default(""),
  trackingNumber: text("tracking_number"),
  discountCode: text("discount_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percentage"),
  value: integer("value").notNull(),
  minOrder: integer("min_order").default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  orderId: integer("order_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true });
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, status: true, trackingNumber: true });
export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({ id: true, usedCount: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

export type Product = typeof products.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type CartItemWithProduct = CartItem & { product: Product };
