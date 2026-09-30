import { expect, test } from "@playwright/test";
import { addFirstProductToCart, fillCheckout, login, registerCustomer } from "./helpers";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe("admin", () => {
  test("customer tidak bisa membuka halaman admin (404)", async ({ page }) => {
    await registerCustomer(page);
    for (const path of ["/admin", "/admin/orders", "/admin/products/new"]) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(404);
    }
  });

  test("tamu diarahkan ke login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe("dengan akun admin", () => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Isi E2E_ADMIN_EMAIL & E2E_ADMIN_PASSWORD di .env.local untuk tes admin.");

    test("proses pesanan: tandai lunas manual → proses → kirim dengan resi", async ({ browser }) => {
      // Pelanggan membuat pesanan
      const customer = await browser.newPage();
      await registerCustomer(customer);
      await addFirstProductToCart(customer);
      await customer.goto("/checkout");
      await fillCheckout(customer);
      await customer.getByRole("button", { name: /buat pesanan/i }).click();
      await expect(customer).toHaveURL(/\/account\/orders\//);
      const orderUrl = customer.url().split("?")[0]!;
      const orderId = orderUrl.split("/").pop()!;

      // Admin memproses
      const admin = await browser.newPage();
      await login(admin, ADMIN_EMAIL!, ADMIN_PASSWORD!);
      await admin.goto(`/admin/orders/${orderId}`);
      await admin.getByRole("button", { name: "Tandai Sudah Dibayar" }).click();
      await admin.fill("input[name=note]", "Transfer bank (tes otomatis)");
      await admin.getByRole("button", { name: /ya, tandai sudah dibayar/i }).click();
      await admin.getByRole("button", { name: "Proses Pesanan" }).click();
      await admin.locator('form:has(button:has-text("Tandai Dikirim")) input[name=trackingNumber]').fill("E2E-RESI-001");
      await admin.getByRole("button", { name: "Tandai Dikirim" }).click();
      await expect(admin.getByRole("button", { name: "Tandai Selesai" })).toBeVisible();
      await expect(admin.getByText("Pesanan dikirim")).toBeVisible();

      // Pelanggan melihat nomor resi
      await customer.goto(orderUrl);
      await expect(customer.getByText("E2E-RESI-001")).toBeVisible();
    });

    test("semua halaman admin terbuka tanpa error", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
      for (const path of ["/admin", "/admin/orders", "/admin/products", "/admin/products/new", "/admin/categories", "/admin/customers", "/admin/messages"]) {
        const res = await page.goto(path);
        expect(res?.status(), path).toBe(200);
      }
      expect(errors).toEqual([]);
    });
  });
});
