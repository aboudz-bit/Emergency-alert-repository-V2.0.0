import { db } from "@workspace/db";
import {
  products, cartItems, stores, orders, discountCodes,
  type InsertProduct, type InsertCartItem, type InsertOrder, type InsertStore, type InsertDiscountCode,
} from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";

export const storage = {
  // Products
  async getProducts() {
    return db.select().from(products).orderBy(products.createdAt);
  },

  async getFeaturedProducts() {
    return db.select().from(products).where(eq(products.featured, true));
  },

  async getProductsByCategory(category: string) {
    return db.select().from(products).where(eq(products.category, category));
  },

  async searchProducts(search: string) {
    return db
      .select()
      .from(products)
      .where(
        ilike(products.nameEn, `%${search}%`)
      );
  },

  async getProduct(id: number) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product ?? null;
  },

  async createProduct(data: InsertProduct) {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  },

  async updateProduct(id: number, data: Partial<InsertProduct>) {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product ?? null;
  },

  async deleteProduct(id: number) {
    await db.delete(products).where(eq(products.id, id));
  },

  // Cart
  async getCartItems(sessionId: string) {
    const items = await db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return { ...item, product };
      })
    );
    return itemsWithProducts;
  },

  async addCartItem(data: InsertCartItem) {
    const existing = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.sessionId, data.sessionId),
          eq(cartItems.productId, data.productId),
          eq(cartItems.size, data.size),
          eq(cartItems.color, data.color)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing[0].quantity + (data.quantity ?? 1) })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return updated;
    }

    const [item] = await db.insert(cartItems).values(data).returning();
    return item;
  },

  async updateCartItem(id: number, quantity: number) {
    const [item] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return item ?? null;
  },

  async removeCartItem(id: number) {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  },

  async clearCart(sessionId: string) {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  },

  // Orders
  async createOrder(data: InsertOrder) {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  },

  async getOrders(sessionId: string) {
    return db.select().from(orders).where(eq(orders.sessionId, sessionId)).orderBy(orders.createdAt);
  },

  async getOrder(id: number) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order ?? null;
  },

  // Stores
  async getActiveStores() {
    return db.select().from(stores).where(eq(stores.isActive, true));
  },

  async getStore(id: number) {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store ?? null;
  },

  async createStore(data: InsertStore) {
    const [store] = await db.insert(stores).values(data).returning();
    return store;
  },

  // Discount codes
  async getDiscountCode(code: string) {
    const [discount] = await db.select().from(discountCodes).where(eq(discountCodes.code, code.toUpperCase()));
    return discount ?? null;
  },

  async createDiscountCode(data: InsertDiscountCode) {
    const [code] = await db.insert(discountCodes).values(data).returning();
    return code;
  },
};
