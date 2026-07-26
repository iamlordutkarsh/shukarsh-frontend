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
  totalAmount: number;
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
  createdAt: string;
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

export interface CartItem {
  product: Product;
  quantity: number;
}
