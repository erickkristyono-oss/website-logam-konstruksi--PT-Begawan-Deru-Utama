import { expect, test } from "@playwright/test";
import { addFirstProductToCart, expectNoHorizontalScroll, fillCheckout, registerCustomer } from "./helpers";

test.describe("belanja", () => {
  test("tamu yang membuka keranjang diarahkan ke login lalu kembali", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fcart/);
  });

  test("daftar → keranjang → checkout → bayar (simulasi) → lunas", async ({ page }) => {
    await registerCustomer(page);
    const productName = await addFirstProductToCart(page);

    await page.goto("/cart");
    await expect(page.getByText(productName).first()).toBeVisible();
    await page.getByRole("link", { name: /lanjut ke checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout/);

    // Validasi: kirim dengan telepon salah
    await page.fill("#phone", "12");
    await page.getByRole("button", { name: /buat pesanan/i }).click();
    await expect(page.locator("#phone-error")).toBeVisible();

    await fillCheckout(page);
    await page.getByRole("button", { name: /buat pesanan/i }).click();
    await expect(page).toHaveURL(/\/account\/orders\/[a-z0-9]+\?placed=1/);
    await expect(page.getByText(/pesanan berhasil dibuat/i)).toBeVisible();
    await expect(page.getByText(/menunggu pembayaran/i).first()).toBeVisible();

    // Keranjang kosong setelah pesanan dibuat
    await expect(page.getByRole("link", { name: /^keranjang$/i }).first()).toBeVisible();

    await page.getByRole("button", { name: /bayar sekarang/i }).click();
    await expect(page).toHaveURL(/\/payment\/mock\//);
    await page.getByRole("button", { name: /bayar \(berhasil\)/i }).click();
    await expect(page).toHaveURL(/payment=return/);
    await expect(page.getByText(/pembayaran berhasil/i)).toBeVisible();
    await expect(page.getByText(/^Dibayar/).first()).toBeVisible();
  });

  test("parameter URL palsu tidak membuat pesanan lunas", async ({ page }) => {
    await registerCustomer(page);
    await addFirstProductToCart(page);
    await page.goto("/checkout");
    await fillCheckout(page);
    await page.getByRole("button", { name: /buat pesanan/i }).click();
    await expect(page).toHaveURL(/\/account\/orders\//);
    const url = page.url().split("?")[0];
    await page.goto(`${url}?payment=return&transaction_status=settlement&status_code=200`);
    await expect(page.getByText(/pembayaran berhasil/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /bayar sekarang/i })).toBeVisible();
  });

  test("pelanggan bisa membatalkan pesanan yang belum dibayar", async ({ page }) => {
    await registerCustomer(page);
    await addFirstProductToCart(page);
    await page.goto("/checkout");
    await fillCheckout(page);
    await page.getByRole("button", { name: /buat pesanan/i }).click();
    await page.getByRole("button", { name: /batalkan pesanan/i }).click();
    await page.getByRole("button", { name: /ya, batalkan/i }).click();
    await expect(page.getByText(/pesanan dibatalkan/i).first()).toBeVisible();
  });

  test("keranjang & checkout rapi di HP @mobile", async ({ page }) => {
    await registerCustomer(page);
    await addFirstProductToCart(page);
    await page.goto("/cart");
    await expectNoHorizontalScroll(page);
    await page.goto("/checkout");
    await expectNoHorizontalScroll(page);
  });
});
