import { Category, Product, User } from "./types";

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

export async function getProducts(params?: { categoryId?: string; search?: string; page?: number; limit?: number }): Promise<{ products: Product[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

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

export async function getMe(token: string): Promise<{ user: User }> {
  return fetcher<{ user: User }>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createOrder(payload: {
  items: { productId: string; quantity: number; name: string; price: number; image?: string }[];
  shippingAddress: { line1: string; line2?: string; city: string; state?: string; zip: string; country?: string };
  email: string;
}): Promise<{ orderId: string; sessionUrl: string | null }> {
  return fetcher<{ orderId: string; sessionUrl: string | null }>("/orders/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
