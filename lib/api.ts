import {
  AdminReturn,
  AdminReview,
  AnalyticsSummary,
  AppliedCoupon,
  Category,
  Coupon,
  CourierOption,
  ManualStockReason,
  Order,
  Product,
  RatingSummary,
  ReturnOutcome,
  ReturnReason,
  ReturnRequest,
  ReturnStatus,
  Review,
  Shipment,
  StockMove,
  Tracking,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}/api${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getCategories(): Promise<{ categories: Category[] }> {
  return fetcher<{ categories: Category[] }>("/categories", { next: { revalidate: 60 } });
}

export async function getCategory(slug: string): Promise<{ category: Category & { products: Product[] } }> {
  return fetcher<{ category: Category & { products: Product[] } }>(`/categories/${slug}`, { next: { revalidate: 60 } });
}

export type ProductSort = "newest" | "oldest" | "price-asc" | "price-desc" | "name";

export async function getProducts(params?: { categoryId?: string; search?: string; page?: number; limit?: number; sort?: ProductSort }): Promise<{ products: Product[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.sort) searchParams.set("sort", params.sort);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return fetcher<{ products: Product[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/products${query}`, { next: { revalidate: 60 } });
}

/**
 * Pass a token when an admin needs the whole record. Cost price is stripped
 * from the anonymous response, so the edit form has to ask as itself or it
 * would load a blank cost and wipe the real one on save.
 *
 * An authenticated read is never cached: the shared cache is keyed on the URL,
 * so a stored admin response could otherwise be handed to a shopper.
 */
export async function getProduct(slug: string, token?: string): Promise<{ product: Product }> {
  return fetcher<{ product: Product }>(
    `/products/${slug}`,
    token
      ? { cache: "no-store", headers: { Authorization: `Bearer ${token}` } }
      : { next: { revalidate: 60 } }
  );
}

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  return fetcher<{ user: User; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: { email: string; password: string; firstName?: string; lastName?: string }): Promise<{ user: User; token: string }> {
  return fetcher<{ user: User; token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function subscribeToNewsletter(email: string): Promise<{ message: string }> {
  return fetcher<{ message: string }>("/newsletter", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getMe(token: string): Promise<{ user: User }> {
  return fetcher<{ user: User }>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface ShippingAddressInput {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface TaxSummary {
  enabled: boolean;
  total: number;
  cgst: number;
  sgst: number;
  igst: number;
  intraState: boolean;
}

export interface RazorpayOrderResponse {
  orderId: string;
  /** Null on a cash order: there is no payment to open. */
  razorpayOrderId: string | null;
  amount: number;
  currency: string;
  keyId: string | null;
  paymentMethod: PaymentMethod;
  codFee: number;
  itemsTotal: number;
  discountTotal: number;
  shippingAmount: number;
  totalAmount: number;
  courierName: string | null;
  coupon: { code: string; discount: number; freeShipping: boolean } | null;
  tax: TaxSummary;
}

export type PaymentMethod = "PREPAID" | "COD";

export interface OrderQuote {
  itemsTotal: number;
  discountTotal: number;
  shippingAmount: number;
  /** What cash on delivery adds. Zero unless COD was asked for and allowed. */
  codFee: number;
  /** What this quote is priced for, which is prepaid whenever COD was refused. */
  paymentMethod: PaymentMethod;
  /** Why COD was refused, worded for the customer. */
  codError: string | null;
  totalAmount: number;
  courierId: number | null;
  courierName: string | null;
  /** False only when no courier covers the address. Null when it could not be checked. */
  serviceable: boolean | null;
  coupon: AppliedCoupon | null;
  /** Set when a code was sent but could not be used, with the reason why. */
  couponError: string | null;
  tax: TaxSummary & {
    buckets: { rate: number; taxable: number; tax: number; cgst: number; sgst: number; igst: number }[];
  };
}

/**
 * What this bag costs, priced by the server. The checkout page shows this and
 * /orders/create charges the same numbers from the same code.
 */
export async function getOrderQuote(
  payload: {
    items: { productId: string; quantity: number }[];
    pincode?: string;
    state?: string;
    courierId?: number;
    couponCode?: string;
    email?: string;
    paymentMethod?: PaymentMethod;
  },
  token?: string
): Promise<OrderQuote> {
  return fetcher<OrderQuote>("/orders/quote", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * Checks a code against a bag before the customer has entered an address.
 * Throws with the reason when the code cannot be used.
 */
export async function applyCoupon(
  payload: {
    code: string;
    items: { productId: string; quantity: number }[];
    email?: string;
  },
  token?: string
): Promise<{ ok: true; coupon: AppliedCoupon }> {
  return fetcher<{ ok: true; coupon: AppliedCoupon }>("/coupons/apply", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getCoupons(token: string): Promise<{ coupons: Coupon[] }> {
  return fetcher<{ coupons: Coupon[] }>("/coupons", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

export async function createCoupon(token: string, data: Partial<Coupon>): Promise<{ coupon: Coupon }> {
  return fetcher<{ coupon: Coupon }>("/coupons", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateCoupon(
  token: string,
  id: string,
  data: Partial<Coupon>
): Promise<{ coupon: Coupon }> {
  return fetcher<{ coupon: Coupon }>(`/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteCoupon(
  token: string,
  id: string
): Promise<{ deleted?: boolean; deactivated?: boolean; message?: string }> {
  return fetcher(`/coupons/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createRazorpayOrder(
  payload: {
    items: { productId: string; quantity: number }[];
    shippingAddress: ShippingAddressInput;
    email: string;
    courierId?: number;
    couponCode?: string;
    paymentMethod?: PaymentMethod;
  },
  token?: string
): Promise<RazorpayOrderResponse> {
  return fetcher<RazorpayOrderResponse>("/orders/create", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export interface LogisticsConfig {
  enabled: boolean;
  pickupPincode: string | null;
  /** Order value at or above which delivery is free. */
  freeAbove: number;
  /** Charged below that, the same to every pincode. 0 means delivery is always free. */
  flatFee: number;
  /** Absent on an older API, which is the cue to say nothing about COD. */
  cod?: { enabled: boolean; fee: number; maxCollectable: number };
}

export async function getLogisticsConfig(): Promise<LogisticsConfig> {
  return fetcher<LogisticsConfig>("/logistics/config", { cache: "no-store" });
}

/**
 * What delivery costs and when it lands. No per courier rates: the customer does
 * not pick a courier, so the only questions left are how much and how long.
 */
export interface DeliveryQuote {
  /** False when live shipping is off, so there is no estimate to be had. */
  enabled: boolean;
  serviceable: boolean;
  weightKg?: number;
  shippingAmount: number;
  freeShipping: boolean;
  /** What is still to be spent to earn free delivery. 0 when there is nothing to earn. */
  shortfall: number;
  etdDays: number | null;
  etd: string | null;
  blocked?: { courierName: string; reason: string }[];
}

export async function getDeliveryQuote(payload: {
  pincode: string;
  items: { productId: string; quantity: number }[];
}): Promise<DeliveryQuote> {
  return fetcher<DeliveryQuote>("/logistics/rates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function lookupPincode(pincode: string): Promise<{ city: string | null; state: string | null }> {
  return fetcher<{ city: string | null; state: string | null }>(`/logistics/pincode/${pincode}`);
}

export async function verifyRazorpayPayment(payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ message: string; orderId: string }> {
  return fetcher<{ message: string; orderId: string }>("/orders/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Signs the request as whoever holds the token.
 *
 * Nothing about it is admin-only, and half its callers are shopper endpoints:
 * cancelling an order, changing a password, reading one's own order. The
 * permission is decided by the API from the token, never by which helper was
 * used here.
 */
function withToken<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  return fetcher<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

export async function createProduct(token: string, data: Partial<Product>): Promise<{ product: Product }> {
  return withToken<{ product: Product }>("/products", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduct(token: string, id: string, data: Partial<Product>): Promise<{ product: Product }> {
  return withToken<{ product: Product }>(`/products/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(token: string, id: string): Promise<void> {
  await withToken<{ message: string }>(`/products/${id}`, token, {
    method: "DELETE",
  });
}

export async function createCategory(token: string, data: Partial<Category>): Promise<{ category: Category }> {
  return withToken<{ category: Category }>("/categories", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(token: string, id: string, data: Partial<Category>): Promise<{ category: Category }> {
  return withToken<{ category: Category }>(`/categories/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  await withToken<{ message: string }>(`/categories/${id}`, token, {
    method: "DELETE",
  });
}

export async function getOrders(token: string): Promise<{ orders: Order[] }> {
  return withToken<{ orders: Order[] }>("/orders", token, { cache: "no-store" });
}

export async function updateOrderStatus(token: string, id: string, status: string): Promise<{ order: Order }> {
  return withToken<{ order: Order }>(`/orders/${id}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getOrderCourierOptions(
  token: string,
  id: string
): Promise<{ serviceable: boolean; options: CourierOption[]; weightKg: number }> {
  return withToken<{ serviceable: boolean; options: CourierOption[]; weightKg: number }>(
    `/logistics/orders/${id}/rates`,
    token,
    { cache: "no-store" }
  );
}

export async function shipOrder(token: string, id: string, courierId?: number): Promise<{ order: Order }> {
  return withToken<{ order: Order }>(`/logistics/orders/${id}/ship`, token, {
    method: "POST",
    body: JSON.stringify(courierId ? { courierId } : {}),
  });
}

export interface SyncResult {
  checked: number;
  advanced: number;
  failed: number;
  /** True when the server reused a recent run instead of asking couriers again. */
  skipped: boolean;
}

export async function syncTracking(token: string): Promise<SyncResult> {
  return withToken<SyncResult>("/logistics/sync", token, { method: "POST" });
}

export async function setOrderTracking(
  token: string,
  id: string,
  data: { awb: string; courierName?: string; trackingUrl?: string }
): Promise<{ order: Order }> {
  return withToken<{ order: Order }>(`/logistics/orders/${id}/tracking`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function schedulePickup(token: string, id: string, date?: string): Promise<{ shipment: Shipment }> {
  return withToken<{ shipment: Shipment }>(`/logistics/orders/${id}/pickup`, token, {
    method: "POST",
    body: JSON.stringify(date ? { date } : {}),
  });
}

export async function generateOrderInvoice(token: string, id: string): Promise<{ shipment: Shipment }> {
  return withToken<{ shipment: Shipment }>(`/logistics/orders/${id}/invoice`, token, { method: "POST" });
}

export async function generateOrderManifest(token: string, id: string): Promise<{ shipment: Shipment }> {
  return withToken<{ shipment: Shipment }>(`/logistics/orders/${id}/manifest`, token, { method: "POST" });
}

export async function cancelOrderShipment(token: string, id: string): Promise<{ shipment: Shipment }> {
  return withToken<{ shipment: Shipment }>(`/logistics/orders/${id}/cancel-shipment`, token, { method: "POST" });
}

export async function getOrder(token: string, id: string): Promise<{ order: Order }> {
  return withToken<{ order: Order }>(`/orders/${id}`, token, { cache: "no-store" });
}

export async function changePassword(
  token: string,
  payload: { currentPassword: string; newPassword: string }
): Promise<{ message: string }> {
  return withToken<{ message: string }>("/auth/change-password", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelOrder(token: string, id: string): Promise<{ order: Order }> {
  return withToken<{ order: Order }>(`/orders/${id}/cancel`, token, { method: "POST" });
}

export async function trackOrder(token: string, id: string): Promise<{ tracking: Tracking | null }> {
  return withToken<{ tracking: Tracking | null }>(`/logistics/orders/${id}/track`, token, { cache: "no-store" });
}

export async function requestReturn(
  token: string,
  orderId: string,
  payload: {
    reason: ReturnReason;
    outcome: ReturnOutcome;
    note: string;
    photos?: string[];
    items: { orderItemId: string; quantity: number }[];
  }
): Promise<{ return: ReturnRequest }> {
  return withToken<{ return: ReturnRequest }>(`/orders/${orderId}/returns`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function withdrawReturn(
  token: string,
  orderId: string,
  returnId: string
): Promise<{ return: ReturnRequest }> {
  return withToken<{ return: ReturnRequest }>(
    `/orders/${orderId}/returns/${returnId}/withdraw`,
    token,
    { method: "POST" }
  );
}

export async function getReturns(token: string, status?: ReturnStatus): Promise<{ returns: AdminReturn[] }> {
  const query = status ? `?status=${status}` : "";
  return withToken<{ returns: AdminReturn[] }>(`/returns${query}`, token, { cache: "no-store" });
}

export async function updateReturn(
  token: string,
  id: string,
  payload: {
    status: "APPROVED" | "REJECTED" | "RECEIVED" | "COMPLETED";
    adminNote?: string;
    items?: { orderItemId: string; resellable: boolean }[];
  }
): Promise<{ return: AdminReturn }> {
  return withToken<{ return: AdminReturn }>(`/returns/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Sends the money back. Safe to call again after a timeout: the return id is the
 * idempotency key at Razorpay's end, so a repeat cannot pay twice.
 */
export async function refundReturn(token: string, id: string): Promise<{ return: AdminReturn }> {
  return withToken<{ return: AdminReturn }>(`/returns/${id}/refund`, token, { method: "POST" });
}

/**
 * Writes down a refund the shop already paid by hand, for a cash order with no
 * Razorpay payment behind it. Moves no money itself.
 */
export async function recordManualRefund(
  token: string,
  id: string,
  reference: string
): Promise<{ return: AdminReturn }> {
  return withToken<{ return: AdminReturn }>(`/returns/${id}/refund/manual`, token, {
    method: "POST",
    body: JSON.stringify({ reference }),
  });
}

/**
 * Reviews for one product.
 *
 * Cached for the same minute as the catalogue, because this is read while
 * rendering the product page and a no-store fetch there would make the whole
 * page dynamic to keep one list fresh. The shopper who just posted is not left
 * waiting on it: the form shows them their own review from the write response.
 */
export async function getReviews(
  productId: string,
  params?: { page?: number; limit?: number }
): Promise<{ reviews: Review[]; summary: RatingSummary; pagination: { page: number; limit: number; total: number; pages: number } }> {
  const search = new URLSearchParams({ productId });
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  return fetcher(`/reviews?${search.toString()}`, { next: { revalidate: 60 } });
}

/** Whether this shopper may review the product, and what they already said. */
export async function getMyReview(
  token: string,
  productId: string
): Promise<{ canReview: boolean; review: Review | null }> {
  return withToken(`/reviews/mine?productId=${encodeURIComponent(productId)}`, token, {
    cache: "no-store",
  });
}

/** Which of these products the shopper has already reviewed. One call, not one per item. */
export async function getMyReviews(token: string, productIds: string[]): Promise<{ reviews: Review[] }> {
  return withToken(`/reviews/mine/list?productIds=${encodeURIComponent(productIds.join(","))}`, token, {
    cache: "no-store",
  });
}

export async function saveReview(
  token: string,
  payload: { productId: string; rating: number; comment?: string }
): Promise<{ review: Review }> {
  return withToken("/reviews", token, { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteReview(token: string, id: string): Promise<{ message: string }> {
  return withToken(`/reviews/${id}`, token, { method: "DELETE" });
}

export async function getAllReviews(token: string): Promise<{ reviews: AdminReview[] }> {
  return withToken("/reviews/admin/all", token, { cache: "no-store" });
}

export async function hideReview(
  token: string,
  id: string,
  reason: string
): Promise<{ review: AdminReview }> {
  return withToken(`/reviews/${id}/hide`, token, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function unhideReview(token: string, id: string): Promise<{ review: AdminReview }> {
  return withToken(`/reviews/${id}/unhide`, token, { method: "POST" });
}

export async function uploadProductImages(token: string, files: File[]): Promise<{ urls: string[] }> {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));

  const response = await fetch(`${API_URL}/api/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(error.error || "Upload failed");
  }

  return response.json() as Promise<{ urls: string[] }>;
}

/**
 * What was in an abandoned checkout, for the link in a recovery email. Signed
 * rather than logged in, because the customer may not have an account.
 */
export async function recoverBag(
  orderId: string,
  token: string
): Promise<{ items: { product: Product; quantity: number }[] }> {
  return fetcher<{ items: { product: Product; quantity: number }[] }>(
    `/orders/${orderId}/recover?token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
}

export async function getAnalytics(token: string, days: number): Promise<{ summary: AnalyticsSummary }> {
  return withToken<{ summary: AnalyticsSummary }>(`/analytics/summary?days=${days}`, token, {
    cache: "no-store",
  });
}

/**
 * Moves stock by a difference, never to a total, so two people receiving stock at
 * the same time both count rather than one overwriting the other.
 */
export async function adjustStock(
  token: string,
  productId: string,
  payload: { delta: number; reason: ManualStockReason; note?: string }
): Promise<{ product: Product }> {
  return withToken<{ product: Product }>(`/products/${productId}/stock`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getStockMoves(
  token: string,
  productId: string,
  limit = 30
): Promise<{ moves: StockMove[] }> {
  return withToken<{ moves: StockMove[] }>(`/products/${productId}/stock-moves?limit=${limit}`, token, {
    cache: "no-store",
  });
}

/** Photos for a return. Separate endpoint from the catalogue's: no admin needed. */
export async function uploadReturnPhotos(token: string, files: File[]): Promise<{ urls: string[] }> {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));

  const response = await fetch(`${API_URL}/api/uploads/returns`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(error.error || "Upload failed");
  }

  return response.json() as Promise<{ urls: string[] }>;
}

export async function deleteProductImage(token: string, url: string): Promise<{ removed: boolean }> {
  return withToken<{ removed: boolean }>("/uploads", token, {
    method: "DELETE",
    body: JSON.stringify({ url }),
  });
}

export async function getUploadConfig(token: string): Promise<{ enabled: boolean; maxFileSize: number; maxFiles: number }> {
  return withToken<{ enabled: boolean; maxFileSize: number; maxFiles: number }>("/uploads/config", token);
}

export async function getWishlist(token: string): Promise<{ products: Product[] }> {
  return withToken<{ products: Product[] }>("/wishlist", token, { cache: "no-store" });
}

export async function addToWishlist(token: string, productId: string): Promise<{ products: Product[] }> {
  return withToken<{ products: Product[] }>("/wishlist", token, {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export async function removeFromWishlist(token: string, productId: string): Promise<{ products: Product[] }> {
  return withToken<{ products: Product[] }>(`/wishlist/${productId}`, token, { method: "DELETE" });
}

export async function mergeWishlist(token: string, productIds: string[]): Promise<{ products: Product[] }> {
  return withToken<{ products: Product[] }>("/wishlist/merge", token, {
    method: "POST",
    body: JSON.stringify({ productIds }),
  });
}
