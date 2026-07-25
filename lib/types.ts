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
  product: Product;
}

export interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  customerEmail?: string | null;
  customerName?: string | null;
  shippingAddress: Record<string, string>;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
