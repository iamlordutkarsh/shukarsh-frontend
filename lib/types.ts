export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  /** Order among its siblings. A menu is not alphabetical. */
  position: number;
  parentId: string | null;
  /** Only on the tree read: this category's own subcategories, in order. */
  children?: Category[];
  /** Only on a single category read. Root first, this category last. */
  path?: { id: string; name: string; slug: string }[];
}

/** How a category is named from somewhere else: a product, a breadcrumb. */
export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export type AttributeKind = "SELECT" | "MULTISELECT" | "TEXT" | "NUMBER";

/**
 * One question a category asks about its products.
 *
 * Inherited from every ancestor, which is why `categoryId` may not be the
 * category that was asked: "Country of origin" is defined once at the root and
 * answered everywhere below it.
 */
export interface AttributeDefinition {
  id: string;
  key: string;
  label: string;
  kind: AttributeKind;
  /** What a NUMBER is counted in. Null for every other kind. */
  unit: string | null;
  required: boolean;
  filterable: boolean;
  position: number;
  options: { id: string; value: string; position: number }[];
  /** Which category actually defines it, and whether that is an ancestor. */
  categoryId: string;
  categoryName?: string;
  inherited: boolean;
}

/** What one product answered. Always a list, so one shape reads for every kind. */
export interface ProductAttribute {
  key: string;
  label: string;
  kind: AttributeKind;
  unit: string | null;
  values: string[];
}

/** One buyable cell: a colour, a size, or the pairing of the two. */
export interface ProductVariant {
  id: string;
  /** The size. Empty on a product sold by colour alone. */
  label: string;
  /** Null on a product sold in sizes only. */
  colourId: string | null;
  position: number;
  stock: number;
  isActive: boolean;
  /** Already resolved against the product's price, so it is always spendable. */
  price: number;
  /** Whether that price is this cell's own or inherited from the product. */
  hasOwnPrice: boolean;
}

/** One colour a product comes in. The photos hang here rather than on each cell. */
export interface ProductColour {
  id: string;
  name: string;
  /** `#rrggbb`, or null for a colour with no sensible hex. */
  hex: string | null;
  /** This colour's own photos. Empty falls back to the product's. */
  images: string[];
  position: number;
  isActive: boolean;
}

/** One row of the spec table under a product. */
export interface ProductSpec {
  label: string;
  value: string;
}

/** One block of the long copy. `kind` says which shape it is. */
export type DetailBlock =
  | { kind: "text"; title: string; body: string }
  | { kind: "highlights"; title: string; items: string[] }
  | { kind: "faq"; title: string; items: { question: string; answer: string }[] };

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
  /**
   * Empty for a product sold as one thing. When it has entries, `stock` is their
   * sum and nothing can be bought without choosing one of them.
   */
  variants: ProductVariant[];
  /** Empty for a product that does not come in colours. */
  colours: ProductColour[];
  /**
   * The cheapest and dearest a shopper can actually pay. Equal when no option
   * overrides the price, which is what lets a card decide whether to say "from".
   */
  priceFrom: number;
  priceTo: number;
  countryOfOrigin: string | null;
  manufacturerName: string | null;
  manufacturerAddr: string | null;
  manufacturerPin: string | null;
  /**
   * The answers to its category's questions, in the order the category asks
   * them. Structured and consistent across the catalogue, unlike `specs`, which
   * stays as the escape hatch for a one-off fact.
   */
  attributes: ProductAttribute[];
  /** The spec table. Empty when the shop gave none. */
  specs: ProductSpec[];
  /** The long copy, as blocks. Empty when the shop gave none. */
  details: DetailBlock[];
  categoryId: string;
  /**
   * Only what a product carries about where it is filed. Narrower than Category
   * on purpose: serializeProduct sends these three fields and no more, so typing
   * it as the whole thing promised a description and a parent that never arrive.
   */
  category: CategoryRef;
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
  /** The size as it read when bought, null for a product without sizes. */
  variantLabel: string | null;
  /** The colour as it read when bought, null for a product without colours. */
  variantColour: string | null;
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
