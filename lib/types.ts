export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  isActive: boolean;
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  hsn: string | null;
  /** GST percent already inside `price`, since listed prices are the MRP. */
  gstRate: number;
  /**
   * Net of GST. Only present on admin responses; the public catalogue strips
   * it, so treat undefined as "not visible to me" rather than "not set".
   */
  costPrice?: number | null;
  categoryId: string;
  category: Category;
  createdAt: string;
  /** When the shop last touched it, which is what the sitemap reports. */
  updatedAt: string;
  /**
   * Only on shopper-facing reads. Undefined means this response did not count
   * them, which is not the same as nobody having reviewed, so render nothing
   * rather than an empty row of stars.
   */
  rating?: RatingSummary;
}

export interface RatingSummary {
  count: number;
  /** One decimal, or null when nobody has reviewed yet. */
  average: number | null;
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  comment: string | null;
  /** A first name and a surname initial. Never the full name or the email. */
  author: string;
  createdAt: string;
  updatedAt: string;
  /** Only ever sent for the shopper's own review, and to an admin. */
  hiddenAt?: string | null;
  hiddenReason?: string | null;
}

export interface AdminReview extends Review {
  product: { id: string; name: string; slug: string };
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  gstRate: number;
  taxableAmount: number;
  taxAmount: number;
  product: Product;
}

export interface Shipment {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string | null;
  providerShipmentId: string | null;
  providerReference: string | null;
  awb: string | null;
  courierId: number | null;
  courierName: string | null;
  labelUrl: string | null;
  invoiceUrl: string | null;
  manifestUrl: string | null;
  trackingUrl: string | null;
  status: string | null;
  statusCode: number | null;
  appliedWeightKg: number | null;
  pickupScheduledAt: string | null;
  pickupToken: string | null;
  lastSyncedAt: string | null;
}

export interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  /** COD is unpaid until the courier collects, which is not the same as unpaid. */
  paymentMethod: "PREPAID" | "COD";
  itemsTotal: number;
  shippingAmount: number;
  /** What the courier charges to collect cash. Zero on a prepaid order. */
  codFee: number;
  /** totalAmount is itemsTotal - discountTotal + shippingAmount + codFee. */
  discountTotal: number;
  couponCode?: string | null;
  totalAmount: number;
  /** GST inside totalAmount, not added to it. */
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  courierId?: number | null;
  courierName?: string | null;
  shippingAddress: Record<string, string>;
  shipment?: Shipment | null;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  items: OrderItem[];
  deliveredAt?: string | null;
  returns?: ReturnRequest[];
  /** Only on responses that loaded the returns, so undefined means "unknown". */
  returnWindow?: ReturnWindow;
  createdAt: string;
}

export type ReturnReason = "DAMAGED" | "WRONG_ITEM";
export type ReturnOutcome = "REFUND" | "EXCHANGE";
export type ReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "COMPLETED"
  | "WITHDRAWN";

export interface ReturnItem {
  id: string;
  orderItemId: string;
  quantity: number;
  resellable: boolean | null;
  product: { id: string; name: string; slug: string; images: string[] } | null;
}

export interface AnalyticsSummary {
  days: number;
  from: string;
  money: {
    revenue: number;
    orders: number;
    averageOrder: number;
    gstCollected: number;
    discountGiven: number;
    deliveryCharged: number;
    refunded: number;
  };
  margin: {
    netSales: number;
    cost: number;
    profit: number;
    percent: number;
    /** Share of units sold whose cost is known, 0 to 1. */
    coverage: number;
  };
  funnel: {
    checkoutsStarted: number;
    paid: number;
    abandonRate: number;
  };
  daily: { day: string; revenue: number; orders: number }[];
  topProducts: { id: string; name: string; slug: string; units: number; revenue: number }[];
  deadStock: { id: string; name: string; slug: string; stock: number }[];
  returns: { units: number; rate: number; damaged: number; wrongItem: number };
  stock: { onShelf: number; valueAtCost: number; lowCount: number };
}

export type StockMoveReason =
  | "INITIAL"
  | "SALE"
  | "CANCELLATION"
  | "REOPEN"
  | "RETURN_RESTOCK"
  | "RECEIVED"
  | "CORRECTION"
  | "DAMAGE";

/** The three a person may pick. The rest are written by the shop itself. */
export type ManualStockReason = "RECEIVED" | "CORRECTION" | "DAMAGE";

export interface StockMove {
  id: string;
  delta: number;
  balance: number;
  reason: StockMoveReason;
  note: string | null;
  orderId: string | null;
  by: string | null;
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  reason: ReturnReason;
  outcome: ReturnOutcome;
  status: ReturnStatus;
  customerNote: string;
  photos: string[];
  adminNote: string | null;
  refundAmount: number | null;
  refundedAt: string | null;
  /** Razorpay's own view: pending, processed or failed. */
  refundStatus: string | null;
  items: ReturnItem[];
  decidedAt: string | null;
  receivedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnWindow {
  open: boolean;
  block:
    | "NOT_PAID"
    | "NOT_DELIVERED"
    | "NO_DELIVERY_DATE"
    | "WINDOW_CLOSED"
    | "ALREADY_OPEN"
    | "NOTHING_LEFT"
    | null;
  closesAt: string | null;
  /** Units still claimable, keyed by order item id. */
  available: Record<string, number>;
}

/** A return in the admin queue, with the order context a decision needs. */
export interface AdminReturn extends ReturnRequest {
  proposedRefund: number;
  refundId: string | null;
  refundError: string | null;
  order: {
    id: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    deliveredAt: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    razorpayPaymentId: string | null;
  };
}

export interface CourierOption {
  courierId: number;
  courierName: string;
  rate: number;
  etd: string | null;
  etdDays: number | null;
  isSurface: boolean;
  rating: number | null;
  chargeWeightKg: number | null;
  recommended: boolean;
}

export interface TrackingEvent {
  date: string | null;
  activity: string | null;
  location: string | null;
  status: string | null;
  statusLabel: string | null;
}

export interface Tracking {
  awb: string | null;
  courierName: string | null;
  currentStatus: string | null;
  statusCode: number | null;
  trackUrl: string | null;
  etd: string | null;
  deliveredAt: string | null;
  events: TrackingEvent[];
}

export type CouponType = "PERCENT" | "FLAT" | "FREE_SHIPPING";

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  maxDiscount: number | null;
  minOrderValue: number;
  usageLimit: number | null;
  perUserLimit: number | null;
  usageCount: number;
  firstOrderOnly: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  /** Empty for a coupon that covers the whole catalogue. */
  categoryIds: string[];
  productIds: string[];
  /** The targeted products with their names, for showing what is selected. */
  products: { id: string; name: string }[];
  redemptionCount: number;
  createdAt: string;
}

/** A coupon as it looks once it has been applied to a bag. */
export interface AppliedCoupon {
  code: string;
  type: CouponType;
  description: string | null;
  discount: number;
  freeShipping: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
