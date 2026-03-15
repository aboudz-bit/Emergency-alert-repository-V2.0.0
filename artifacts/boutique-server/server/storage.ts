import { db } from "./db";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import {
  products, cartItems, orders, discountCodes, adminUsers, stores, notifications,
  type Product, type CartItem, type CartItemWithProduct,
  type InsertCartItem, type InsertProduct, type Order,
  type InsertOrder, type DiscountCode, type InsertDiscountCode,
  type Store, type InsertStore, type Notification, type InsertNotification
} from "@shared/schema";

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;

  getCartItems(sessionId: string): Promise<CartItemWithProduct[]>;
  addCartItem(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<void>;
  clearCart(sessionId: string): Promise<void>;

  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(sessionId: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string, trackingNumber?: string): Promise<Order | undefined>;

  getStores(): Promise<Store[]>;
  getActiveStores(): Promise<Store[]>;
  getStore(id: number): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined>;
  deleteStore(id: number): Promise<void>;

  getDiscountCode(code: string): Promise<DiscountCode | undefined>;
  createDiscountCode(discount: InsertDiscountCode): Promise<DiscountCode>;
  getAllDiscountCodes(): Promise<DiscountCode[]>;
  updateDiscountCode(id: number, data: Partial<InsertDiscountCode>): Promise<DiscountCode | undefined>;
  deleteDiscountCode(id: number): Promise<void>;
  incrementDiscountUsage(id: number): Promise<void>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  getAdminByUsername(username: string): Promise<typeof adminUsers.$inferSelect | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.category, category));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.featured, true));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const q = `%${query}%`;
    return db.select().from(products).where(
      or(
        ilike(products.nameEn, q),
        ilike(products.nameAr, q),
        ilike(products.descriptionEn, q),
        ilike(products.category, q)
      )
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getCartItems(sessionId: string): Promise<CartItemWithProduct[]> {
    const items = await db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
    const result: CartItemWithProduct[] = [];
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) result.push({ ...item, product });
    }
    return result;
  }

  async addCartItem(item: InsertCartItem): Promise<CartItem> {
    const existing = await db.select().from(cartItems).where(
      and(
        eq(cartItems.sessionId, item.sessionId),
        eq(cartItems.productId, item.productId),
        eq(cartItems.size, item.size),
        eq(cartItems.color, item.color)
      )
    );
    if (existing.length > 0) {
      const [updated] = await db.update(cartItems)
        .set({ quantity: existing[0].quantity + (item.quantity ?? 1) })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(cartItems).values({ ...item, quantity: item.quantity ?? 1 }).returning();
    return created;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return updated;
  }

  async removeCartItem(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(sessionId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async getOrders(sessionId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.sessionId, sessionId)).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: number, status: string, trackingNumber?: string): Promise<Order | undefined> {
    const data: any = { status };
    if (trackingNumber) data.trackingNumber = trackingNumber;
    const [updated] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getStores(): Promise<Store[]> {
    return db.select().from(stores);
  }

  async getActiveStores(): Promise<Store[]> {
    return db.select().from(stores).where(eq(stores.isActive, true));
  }

  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async createStore(store: InsertStore): Promise<Store> {
    const [created] = await db.insert(stores).values(store).returning();
    return created;
  }

  async updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined> {
    const [updated] = await db.update(stores).set(store).where(eq(stores.id, id)).returning();
    return updated;
  }

  async deleteStore(id: number): Promise<void> {
    await db.delete(stores).where(eq(stores.id, id));
  }

  async getDiscountCode(code: string): Promise<DiscountCode | undefined> {
    const [discount] = await db.select().from(discountCodes).where(eq(discountCodes.code, code.toUpperCase()));
    return discount;
  }

  async createDiscountCode(discount: InsertDiscountCode): Promise<DiscountCode> {
    const [created] = await db.insert(discountCodes).values({ ...discount, code: discount.code.toUpperCase() }).returning();
    return created;
  }

  async getAllDiscountCodes(): Promise<DiscountCode[]> {
    return db.select().from(discountCodes);
  }

  async updateDiscountCode(id: number, data: Partial<InsertDiscountCode>): Promise<DiscountCode | undefined> {
    const [updated] = await db.update(discountCodes).set(data).where(eq(discountCodes.id, id)).returning();
    return updated;
  }

  async deleteDiscountCode(id: number): Promise<void> {
    await db.delete(discountCodes).where(eq(discountCodes.id, id));
  }

  async incrementDiscountUsage(id: number): Promise<void> {
    const [discount] = await db.select().from(discountCodes).where(eq(discountCodes.id, id));
    if (discount) {
      await db.update(discountCodes).set({ usedCount: discount.usedCount + 1 }).where(eq(discountCodes.id, id));
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select().from(notifications).where(
      and(eq(notifications.userId, userId), eq(notifications.read, false))
    );
    return result.length;
  }

  async getAdminByUsername(username: string) {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin;
  }
}

export const storage = new DatabaseStorage();
