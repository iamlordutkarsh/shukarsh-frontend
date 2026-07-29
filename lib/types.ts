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
  itemsTotal: number;
  shippingAmount: number;
  /** totalAmount is itemsTotal - discountTotal + shippingAmount. */
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
