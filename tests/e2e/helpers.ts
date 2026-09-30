import { expect, type Page } from "@playwright/test";

/** Daftar akun customer baru (email unik) & kembali dalam keadaan login. */
export async function registerCustomer(page: Page) {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.local`;
  await page.goto("/register");
  await page.fill("#name", "Pelanggan E2E");
  await page.fill("#email", email);
  await page.fill("#phone", "081234567890");
  await page.fill("#password", "RahasiaE2E123");
  await page.fill("#confirmPassword", "RahasiaE2E123");
  await page.getByRole("button", { name: /daftar/i }).click();
  await expect(page).not.toHaveURL(/\/register/);
  return email;
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.locator("form button[type=submit]").click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Tambahkan produk pertama yang tersedia di katalog ke keranjang. Mengembalikan nama produknya. */
export async function addFirstProductToCart(page: Page) {
  await page.goto("/products");
  // Tombol ikon di kartu produk bernama "Tambah <nama produk> ke keranjang" (produk stok habis tidak punya tombol ini).
  const addButton = /^tambah .+ ke keranjang$/i;
  const card = page.locator("article").filter({ has: page.getByRole("button", { name: addButton }) }).first();
  const name = (await card.getByRole("heading").first().textContent())?.trim() ?? "";
  await card.getByRole("button", { name: addButton }).click();
  await expect(card.getByText(/ditambahkan/i)).toBeVisible();
  return name;
}

export async function fillCheckout(page: Page) {
  await page.fill("#phone", "081234567890");
  await page.fill("#address", "Jl. Pengujian Otomatis No. 1, Pamulang");
  await page.fill("#city", "Tangerang Selatan");
  await page.fill("#postalCode", "15417");
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}
