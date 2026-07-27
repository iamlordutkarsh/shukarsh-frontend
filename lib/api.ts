import { Category, CourierOption, Order, Product, Shipment, Tracking, User } from "./types";

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

export async function getProduct(slug: string): Promise<{ product: Product }> {
  return fetcher<{ product: Product }>(`/products/${slug}`, { next: { revalidate: 60 } });
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

export interface RazorpayOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  itemsTotal: number;
  shippingAmount: number;
  totalAmount: number;
  courierName: string | null;
}

export async function createRazorpayOrder(
  payload: {
    items: { productId: string; quantity: number }[];
    shippingAddress: ShippingAddressInput;
    email: string;
    courierId?: number;
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
}

export async function getLogisticsConfig(): Promise<LogisticsConfig> {
  return fetcher<LogisticsConfig>("/logistics/config", { cache: "no-store" });
}

export interface ShippingRates {
  enabled: boolean;
  serviceable: boolean;
  weightKg?: number;
  options: CourierOption[];
  blocked?: { courierName: string; reason: string }[];
  freeShipping: boolean;
}

export async function getShippingRates(payload: {
  pincode: string;
  items: { productId: string; quantity: number }[];
}): Promise<ShippingRates> {
  return fetcher<ShippingRates>("/logistics/rates", {
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

function adminFetcher<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  return fetcher<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

export async function createProduct(token: string, data: Partial<Product>): Promise<{ product: Product }> {
  return adminFetcher<{ product: Product }>("/products", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduct(token: string, id: string, data: Partial<Product>): Promise<{ product: Product }> {
  return adminFetcher<{ product: Product }>(`/products/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(token: string, id: string): Promise<void> {
  await adminFetcher<{ message: string }>(`/products/${id}`, token, {
    method: "DELETE",
  });
}

export async function createCategory(token: string, data: Partial<Category>): Promise<{ category: Category }> {
  return adminFetcher<{ category: Category }>("/categories", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(token: string, id: string, data: Partial<Category>): Promise<{ category: Category }> {
  return adminFetcher<{ category: Category }>(`/categories/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  await adminFetcher<{ message: string }>(`/categories/${id}`, token, {
    method: "DELETE",
  });
}

export async function getOrders(token: string): Promise<{ orders: Order[] }> {
  return adminFetcher<{ orders: Order[] }>("/orders", token, { cache: "no-store" });
}

export async function updateOrderStatus(token: string, id: string, status: string): Promise<{ order: Order }> {
  return adminFetcher<{ order: Order }>(`/orders/${id}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getOrderCourierOptions(
  token: string,
  id: string
): Promise<{ serviceable: boolean; options: CourierOption[]; weightKg: number }> {
  return adminFetcher<{ serviceable: boolean; options: CourierOption[]; weightKg: number }>(
    `/logistics/orders/${id}/rates`,
    token,
    { cache: "no-store" }
  );
}

export async function shipOrder(token: string, id: string, courierId?: number): Promise<{ order: Order }> {
  return adminFetcher<{ order: Order }>(`/logistics/orders/${id}/ship`, token, {
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
  return adminFetcher<SyncResult>("/logistics/sync", token, { method: "POST" });
}

export async function setOrderTracking(
  token: string,
  id: string,
  data: { awb: string; courierName?: string; trackingUrl?: string }
): Promise<{ order: Order }> {
  return adminFetcher<{ order: Order }>(`/logistics/orders/${id}/tracking`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function schedulePickup(token: string, id: string, date?: string): Promise<{ shipment: Shipment }> {
  return adminFetcher<{ shipment: Shipment }>(`/logistics/orders/${id}/pickup`, token, {
    method: "POST",
    body: JSON.stringify(date ? { date } : {}),
  });
}

export async function generateOrderInvoice(token: string, id: string): Promise<{ shipment: Shipment }> {
  return adminFetcher<{ shipment: Shipment }>(`/logistics/orders/${id}/invoice`, token, { method: "POST" });
}

export async function generateOrderManifest(token: string, id: string): Promise<{ shipment: Shipment }> {
  return adminFetcher<{ shipment: Shipment }>(`/logistics/orders/${id}/manifest`, token, { method: "POST" });
}

export async function cancelOrderShipment(token: string, id: string): Promise<{ shipment: Shipment }> {
  return adminFetcher<{ shipment: Shipment }>(`/logistics/orders/${id}/cancel-shipment`, token, { method: "POST" });
}

export async function getOrder(token: string, id: string): Promise<{ order: Order }> {
  return adminFetcher<{ order: Order }>(`/orders/${id}`, token, { cache: "no-store" });
}

export async function changePassword(
  token: string,
  payload: { currentPassword: string; newPassword: string }
): Promise<{ message: string }> {
  return adminFetcher<{ message: string }>("/auth/change-password", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelOrder(token: string, id: string): Promise<{ order: Order }> {
  return adminFetcher<{ order: Order }>(`/orders/${id}/cancel`, token, { method: "POST" });
}

export async function trackOrder(token: string, id: string): Promise<{ tracking: Tracking | null }> {
  return adminFetcher<{ tracking: Tracking | null }>(`/logistics/orders/${id}/track`, token, { cache: "no-store" });
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

export async function deleteProductImage(token: string, url: string): Promise<{ removed: boolean }> {
  return adminFetcher<{ removed: boolean }>("/uploads", token, {
    method: "DELETE",
    body: JSON.stringify({ url }),
  });
}

export async function getUploadConfig(token: string): Promise<{ enabled: boolean; maxFileSize: number; maxFiles: number }> {
  return adminFetcher<{ enabled: boolean; maxFileSize: number; maxFiles: number }>("/uploads/config", token);
}

export async function getWishlist(token: string): Promise<{ products: Product[] }> {
  return adminFetcher<{ products: Product[] }>("/wishlist", token, { cache: "no-store" });
}

export async function addToWishlist(token: string, productId: string): Promise<{ products: Product[] }> {
  return adminFetcher<{ products: Product[] }>("/wishlist", token, {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export async function removeFromWishlist(token: string, productId: string): Promise<{ products: Product[] }> {
  return adminFetcher<{ products: Product[] }>(`/wishlist/${productId}`, token, { method: "DELETE" });
}

export async function mergeWishlist(token: string, productIds: string[]): Promise<{ products: Product[] }> {
  return adminFetcher<{ products: Product[] }>("/wishlist/merge", token, {
    method: "POST",
    body: JSON.stringify({ productIds }),
  });
}
