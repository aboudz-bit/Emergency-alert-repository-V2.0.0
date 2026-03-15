/**
 * Shipping Abstraction Layer
 *
 * Vendor-agnostic shipping interface ready for Aramex, SMSA, DHL integration.
 * Phase 1: Flat-rate provider for Saudi Arabia.
 */

export interface ShippingQuote {
  provider: string;
  service: string;
  amount: number; // halalas
  currency: string;
  estimatedDays: number;
  metadata?: Record<string, unknown>;
}

export interface QuoteShippingInput {
  originCity?: string;
  destinationCity: string;
  destinationCountry: string;
  weightGrams?: number;
  itemCount: number;
  subtotal: number;
}

export interface Shipment {
  id: string;
  provider: string;
  trackingNumber: string;
  trackingUrl?: string;
  status: "created" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "returned";
  estimatedDelivery?: Date;
  createdAt: Date;
}

export interface CreateShipmentInput {
  orderId: number;
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  country: string;
  items: Array<{ name: string; quantity: number; weightGrams?: number }>;
}

export interface ShippingProvider {
  readonly name: string;
  quoteShipping(input: QuoteShippingInput): Promise<ShippingQuote[]>;
  createShipment(input: CreateShipmentInput): Promise<Shipment>;
  trackShipment(trackingNumber: string): Promise<Shipment>;
}

const FREE_SHIPPING_THRESHOLD = 15000; // 150 SAR in halalas
const FLAT_RATE = 1500; // 15 SAR in halalas

class FlatRateShippingProvider implements ShippingProvider {
  readonly name = "flat_rate_sa";
  private shipments = new Map<string, Shipment>();

  async quoteShipping(input: QuoteShippingInput): Promise<ShippingQuote[]> {
    const isFree = input.subtotal >= FREE_SHIPPING_THRESHOLD;
    return [
      {
        provider: this.name,
        service: "standard",
        amount: isFree ? 0 : FLAT_RATE,
        currency: "SAR",
        estimatedDays: input.destinationCountry === "SA" ? 3 : 7,
        metadata: { freeShippingApplied: isFree },
      },
    ];
  }

  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    const shipment: Shipment = {
      id: `ship_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      provider: this.name,
      trackingNumber: `MB${Date.now().toString(36).toUpperCase()}`,
      status: "created",
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
    this.shipments.set(shipment.trackingNumber, shipment);
    return shipment;
  }

  async trackShipment(trackingNumber: string): Promise<Shipment> {
    const shipment = this.shipments.get(trackingNumber);
    if (!shipment) throw new Error(`Shipment ${trackingNumber} not found`);
    return shipment;
  }
}

let _provider: ShippingProvider = new FlatRateShippingProvider();

export function getShippingProvider(): ShippingProvider {
  return _provider;
}

export function setShippingProvider(provider: ShippingProvider): void {
  _provider = provider;
}

export const shipping = {
  quoteShipping: (input: QuoteShippingInput) => _provider.quoteShipping(input),
  createShipment: (input: CreateShipmentInput) => _provider.createShipment(input),
  trackShipment: (trackingNumber: string) => _provider.trackShipment(trackingNumber),
};
