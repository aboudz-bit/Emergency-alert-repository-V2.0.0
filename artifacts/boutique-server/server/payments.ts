/**
 * Payment Abstraction Layer
 *
 * Vendor-agnostic payment interface ready for Apple Pay, Mada, Visa/MC integration.
 * Phase 1: Mock provider (no vendor lock-in).
 * Swap the provider implementation when integrating a real PSP (Moyasar, HyperPay, Tap, etc.).
 */

export interface PaymentSession {
  id: string;
  amount: number; // halalas
  currency: string;
  status: "pending" | "authorized" | "captured" | "failed" | "refunded";
  provider: string;
  providerRef?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface CreatePaymentInput {
  orderId: number;
  amount: number; // halalas
  currency?: string; // default SAR
  method: "apple_pay" | "mada" | "visa" | "mastercard" | "cod";
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface RefundInput {
  sessionId: string;
  amount?: number;
  reason?: string;
}

export interface PaymentProvider {
  readonly name: string;
  createPaymentSession(input: CreatePaymentInput): Promise<PaymentSession>;
  confirmPayment(sessionId: string): Promise<PaymentSession>;
  refundPayment(input: RefundInput): Promise<PaymentSession>;
}

class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  private sessions = new Map<string, PaymentSession>();

  async createPaymentSession(input: CreatePaymentInput): Promise<PaymentSession> {
    const session: PaymentSession = {
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount: input.amount,
      currency: input.currency ?? "SAR",
      status: "pending",
      provider: this.name,
      metadata: { orderId: input.orderId, method: input.method, ...input.metadata },
      createdAt: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async confirmPayment(sessionId: string): Promise<PaymentSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Payment session ${sessionId} not found`);
    session.status = "captured";
    return session;
  }

  async refundPayment(input: RefundInput): Promise<PaymentSession> {
    const session = this.sessions.get(input.sessionId);
    if (!session) throw new Error(`Payment session ${input.sessionId} not found`);
    if (session.status !== "captured") throw new Error("Can only refund captured payments");
    session.status = "refunded";
    return session;
  }
}

let _provider: PaymentProvider = new MockPaymentProvider();

export function getPaymentProvider(): PaymentProvider {
  return _provider;
}

export function setPaymentProvider(provider: PaymentProvider): void {
  _provider = provider;
}

export const payments = {
  createPaymentSession: (input: CreatePaymentInput) => _provider.createPaymentSession(input),
  confirmPayment: (sessionId: string) => _provider.confirmPayment(sessionId),
  refundPayment: (input: RefundInput) => _provider.refundPayment(input),
};
