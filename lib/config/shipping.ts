/**
 * Aturan ongkos kirim — SEMENTARA.
 * Perusahaan belum menentukan tarif, jadi ongkir = 0 dan pembeli diberi tahu bahwa
 * ongkir dikonfirmasi oleh tim. Ganti fungsi ini bila tarif sudah ditetapkan
 * (mis. tarif flat, per kota, atau per berat). Selalu dipanggil di SERVER.
 */
export const SHIPPING_NOTE = "Ongkos kirim dikonfirmasi tim kami setelah pesanan dibuat.";

export type ShippingInput = { subtotal: number; city: string };

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- parameter dipakai saat tarif ongkir sudah ditetapkan
export function calculateShippingCost(input: ShippingInput): number {
  return 0;
}
