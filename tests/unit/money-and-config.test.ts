import { describe, expect, it } from "vitest";
import { paymentDeadline, paymentTypeLabel, PAYMENT_WINDOW_HOURS } from "@/lib/config/payment";
import { calculateShippingCost } from "@/lib/config/shipping";
import { motion, staggerDelay } from "@/lib/config/motion";
import { formatDateTime, formatNumber, formatRupiah } from "@/lib/utils/format";

describe("format", () => {
  it("Rupiah tanpa desimal dengan pemisah ribuan", () => {
    expect(formatRupiah(1_550_000)).toBe("Rp 1.550.000");
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatNumber(2_500_000_000)).toBe("2.500.000.000");
  });
  it("tanggal ditampilkan dalam WIB", () => {
    // 29 Sep 2026 18:30 UTC = 30 Sep 2026 01:30 WIB
    expect(formatDateTime(new Date("2026-09-29T18:30:00Z"))).toMatch(/30 Sep 2026.*01[.:]30/);
  });
});

describe("pembayaran & ongkir", () => {
  it(`batas bayar = dibuat + ${PAYMENT_WINDOW_HOURS} jam`, () => {
    const created = new Date("2026-09-30T00:00:00Z");
    expect(paymentDeadline(created).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });
  it("label metode bayar", () => {
    expect(paymentTypeLabel("qris")).toBe("QRIS");
    expect(paymentTypeLabel("manual")).toMatch(/manual/i);
    expect(paymentTypeLabel("metode_baru")).toBe("metode baru");
    expect(paymentTypeLabel(null)).toBeNull();
  });
  it("ongkir sementara 0 (dikonfirmasi admin)", () => {
    expect(calculateShippingCost({ subtotal: 5_000_000, city: "Jakarta" })).toBe(0);
  });
});

describe("animasi", () => {
  it("jeda berurutan per baris", () => {
    expect([0, 1, 3, 4].map((i) => staggerDelay(i))).toEqual([0, motion.stagger, 3 * motion.stagger, 0]);
  });
});
