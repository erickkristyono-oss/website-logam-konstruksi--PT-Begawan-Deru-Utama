const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** 125000 → "Rp 125.000" */
export function formatRupiah(value: number): string {
  // Intl memakai spasi tak-terputus (U+00A0) setelah "Rp"; ganti dengan spasi biasa agar konsisten.
  return rupiah.format(value).replace(/ /g, " ");
}

const number = new Intl.NumberFormat("id-ID");

/** 1500 → "1.500" */
export function formatNumber(value: number): string {
  return number.format(value);
}

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

/** Tanggal & jam dalam WIB, mis. "29 Sep 2026, 15.30". */
export function formatDateTime(value: Date): string {
  return dateTime.format(value);
}
