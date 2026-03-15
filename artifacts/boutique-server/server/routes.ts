import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertOrderSchema, insertProductSchema, insertDiscountCodeSchema, insertStoreSchema } from "@shared/schema";
import { z } from "zod";
import { payments } from "./payments";
import { shipping } from "./shipping";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category, search, featured } = req.query;
      if (search && typeof search === "string") {
        const products = await storage.searchProducts(search);
        return res.json(products);
      }
      if (featured === "true") {
        const products = await storage.getFeaturedProducts();
        return res.json(products);
      }
      if (category && typeof category === "string") {
        const products = await storage.getProductsByCategory(category);
        return res.json(products);
      }
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = req.session?.id || "anonymous";
      const items = await storage.getCartItems(sessionId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const sessionId = req.session?.id || "anonymous";
      const result = insertCartItemSchema.safeParse({ ...req.body, sessionId });
      if (!result.success) return res.status(400).json({ message: "Invalid cart item", errors: result.error.flatten() });
      const item = await storage.addCartItem(result.data);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      if (typeof quantity !== "number" || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      const item = await storage.updateCartItem(parseInt(req.params.id), quantity);
      if (!item) return res.status(404).json({ message: "Cart item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      await storage.removeCartItem(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      const sessionId = req.session?.id || "anonymous";
      await storage.clearCart(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    try {
      const sessionId = req.session?.id || "anonymous";
      const result = insertOrderSchema.safeParse({ ...req.body, sessionId });
      if (!result.success) return res.status(400).json({ message: "Invalid order", errors: result.error.flatten() });
      const order = await storage.createOrder(result.data);
      await storage.clearCart(sessionId);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const sessionId = req.session?.id || "anonymous";
      const ordersList = await storage.getOrders(sessionId);
      res.json(ordersList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Store routes
  app.get("/api/stores", async (_req, res) => {
    try {
      const storesList = await storage.getActiveStores();
      res.json(storesList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.get("/api/stores/:id", async (req, res) => {
    try {
      const store = await storage.getStore(parseInt(req.params.id));
      if (!store) return res.status(404).json({ message: "Store not found" });
      res.json(store);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch store" });
    }
  });

  // Discount validation
  app.post("/api/discounts/validate", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "Code is required" });
      const discount = await storage.getDiscountCode(code);
      if (!discount || !discount.active) return res.status(404).json({ message: "Invalid discount code" });
      if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        return res.status(400).json({ message: "Discount code has been fully redeemed" });
      }
      if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Discount code has expired" });
      }
      res.json({ type: discount.type, value: discount.value, minOrder: discount.minOrder });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate discount code" });
    }
  });

  // Admin routes
  app.post("/api/admin/products", async (req, res) => {
    try {
      const result = insertProductSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: "Invalid product", errors: result.error.flatten() });
      const product = await storage.createProduct(result.data);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    try {
      const product = await storage.updateProduct(parseInt(req.params.id), req.body);
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get("/api/admin/orders", async (_req, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      res.json(allOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/admin/discounts", async (req, res) => {
    try {
      const result = insertDiscountCodeSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: "Invalid discount", errors: result.error.flatten() });
      const discount = await storage.createDiscountCode(result.data);
      res.json(discount);
    } catch (error) {
      res.status(500).json({ message: "Failed to create discount" });
    }
  });

  app.get("/api/admin/discounts", async (_req, res) => {
    try {
      const discounts = await storage.getAllDiscountCodes();
      res.json(discounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discounts" });
    }
  });

  app.delete("/api/admin/discounts/:id", async (req, res) => {
    try {
      await storage.deleteDiscountCode(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete discount" });
    }
  });

  app.post("/api/admin/stores", async (req, res) => {
    try {
      const result = insertStoreSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: "Invalid store", errors: result.error.flatten() });
      const store = await storage.createStore(result.data);
      res.json(store);
    } catch (error) {
      res.status(500).json({ message: "Failed to create store" });
    }
  });

  app.get("/api/admin/stores", async (_req, res) => {
    try {
      const storesList = await storage.getStores();
      res.json(storesList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.patch("/api/admin/stores/:id", async (req, res) => {
    try {
      const store = await storage.updateStore(parseInt(req.params.id), req.body);
      if (!store) return res.status(404).json({ message: "Store not found" });
      res.json(store);
    } catch (error) {
      res.status(500).json({ message: "Failed to update store" });
    }
  });

  app.delete("/api/admin/stores/:id", async (req, res) => {
    try {
      await storage.deleteStore(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete store" });
    }
  });

  // Payment routes
  app.post("/api/payments/session", async (req, res) => {
    try {
      const { orderId, amount, method } = req.body;
      if (!orderId || !amount || !method) {
        return res.status(400).json({ message: "orderId, amount, and method are required" });
      }
      const session = await payments.createPaymentSession({ orderId, amount, method, currency: "SAR" });
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create payment session" });
    }
  });

  app.post("/api/payments/:sessionId/confirm", async (req, res) => {
    try {
      const session = await payments.confirmPayment(req.params.sessionId);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to confirm payment" });
    }
  });

  app.post("/api/payments/:sessionId/refund", async (req, res) => {
    try {
      const { amount, reason } = req.body;
      const session = await payments.refundPayment({ sessionId: req.params.sessionId, amount, reason });
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to refund payment" });
    }
  });

  // Shipping routes
  app.post("/api/shipping/quote", async (req, res) => {
    try {
      const { destinationCity, destinationCountry, itemCount, subtotal } = req.body;
      if (!destinationCity || !destinationCountry) {
        return res.status(400).json({ message: "destinationCity and destinationCountry are required" });
      }
      const quotes = await shipping.quoteShipping({
        destinationCity,
        destinationCountry,
        itemCount: itemCount ?? 1,
        subtotal: subtotal ?? 0,
      });
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get shipping quotes" });
    }
  });

  app.post("/api/shipping/create", async (req, res) => {
    try {
      const shipment = await shipping.createShipment(req.body);
      res.json(shipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create shipment" });
    }
  });

  app.get("/api/shipping/track/:trackingNumber", async (req, res) => {
    try {
      const shipment = await shipping.trackShipment(req.params.trackingNumber);
      res.json(shipment);
    } catch (error: any) {
      res.status(404).json({ message: error.message || "Shipment not found" });
    }
  });

  return httpServer;
}
