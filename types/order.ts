export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED";

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";

/** Ringkasan pesanan untuk daftar. Nilai uang sudah dikonversi dari BigInt ke number. */
export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: Date;
};

export type OrderItemView = {
  id: string;
  productName: string;
  productSlug: string;
  /** null bila produk sudah dihapus / dinonaktifkan (link tidak ditampilkan). */
  productAvailable: boolean;
  image: string | null;
  unit: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  total: number;
  shipping: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  notes: string | null;
  paidAt: Date | null;
  /** "CUSTOMER" | "PAYMENT_EXPIRED" | null */
  cancelReason: string | null;
  /** Nomor resi pengiriman (diisi admin). */
  trackingNumber: string | null;
  /** Batas waktu pembayaran (dibuat + 24 jam). */
  paymentDeadline: Date;
  latestPayment: {
    status: PaymentStatus;
    paymentType: string | null;
    paidAt: Date | null;
    /** true bila halaman pembayaran sebelumnya masih bisa dilanjutkan. */
    canResume: boolean;
  } | null;
  items: OrderItemView[];
  createdAt: Date;
  updatedAt: Date;
};
