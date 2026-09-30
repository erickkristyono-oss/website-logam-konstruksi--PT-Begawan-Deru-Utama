import "server-only";
import type { PaymentProvider } from "./types";

/**
 * Provider SIMULASI untuk development tanpa akun gateway.
 * Halaman /payment/mock/<reference> menampilkan tombol "berhasil / gagal / kedaluwarsa".
 * Hanya aktif bila website berjalan di localhost (lihat lib/payment/index.ts).
 */
export const mockProvider: PaymentProvider = {
  name: "mock",
  async createTransaction({ reference }) {
    return { redirectUrl: `/payment/mock/${encodeURIComponent(reference)}` };
  },
  verifyNotification() {
    return null; // mock tidak menerima webhook dari luar
  },
  async getStatus() {
    return null;
  },
  async cancelTransaction() {},
};
