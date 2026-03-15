import { Router, type IRouter } from "express";
import { storage } from "../lib/storage";
import { insertCartItemSchema, insertOrderSchema } from "@workspace/db";

const router: IRouter = Router();

const getSessionId = (req: any): string => {
  return req.session?.id ?? req.cookies?.session_id ?? "anonymous";
};

// Products
router.get("/products", async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    if (search && typeof search === "string") {
      const prods = await storage.searchProducts(search);
      return res.json(prods);
    }
    if (featured === "true") {
      const prods = await storage.getFeaturedProducts();
      return res.json(prods);
    }
    if (category && typeof category === "string") {
      const prods = await storage.getProductsByCategory(category);
      return res.json(prods);
    }
    const prods = await storage.getProducts();
    res.json(prods);
  } catch {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const product = await storage.getProduct(parseInt(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch {
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

// Cart
router.get("/cart", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const items = await storage.getCartItems(sessionId);
    res.json(items);
  } catch {
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

router.post("/cart", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const result = insertCartItemSchema.safeParse({ ...req.body, sessionId });
    if (!result.success) return res.status(400).json({ message: "Invalid cart item" });
    const item = await storage.addCartItem(result.data);
    res.json(item);
  } catch {
    res.status(500).json({ message: "Failed to add to cart" });
  }
});

router.patch("/cart/:id", async (req, res) => {
  try {
    const { quantity } = req.body;
    if (typeof quantity !== "number" || quantity < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }
    const item = await storage.updateCartItem(parseInt(req.params.id), quantity);
    if (!item) return res.status(404).json({ message: "Cart item not found" });
    res.json(item);
  } catch {
    res.status(500).json({ message: "Failed to update cart item" });
  }
});

router.delete("/cart/:id", async (req, res) => {
  try {
    await storage.removeCartItem(parseInt(req.params.id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to remove cart item" });
  }
});

router.delete("/cart", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    await storage.clearCart(sessionId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

// Orders
router.post("/orders", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const result = insertOrderSchema.safeParse({ ...req.body, sessionId });
    if (!result.success) return res.status(400).json({ message: "Invalid order" });
    const order = await storage.createOrder(result.data);
    await storage.clearCart(sessionId);
    res.json(order);
  } catch {
    res.status(500).json({ message: "Failed to create order" });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const ordersList = await storage.getOrders(sessionId);
    res.json(ordersList);
  } catch {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const order = await storage.getOrder(parseInt(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch {
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

// Stores
router.get("/stores", async (_req, res) => {
  try {
    const storesList = await storage.getActiveStores();
    res.json(storesList);
  } catch {
    res.status(500).json({ message: "Failed to fetch stores" });
  }
});

// Discounts
router.post("/discounts/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Code is required" });
    const discount = await storage.getDiscountCode(code);
    if (!discount || !discount.active) return res.status(404).json({ message: "Invalid discount code" });
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return res.status(400).json({ message: "Discount code fully redeemed" });
    }
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Discount code has expired" });
    }
    res.json({ type: discount.type, value: discount.value, minOrder: discount.minOrder });
  } catch {
    res.status(500).json({ message: "Failed to validate discount code" });
  }
});

export default router;
