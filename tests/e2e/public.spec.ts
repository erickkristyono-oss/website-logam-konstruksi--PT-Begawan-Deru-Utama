import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll } from "./helpers";

const pages = [
  { path: "/", heading: /solusi material logam/i },
  { path: "/products", heading: /produk/i },
  { path: "/about", heading: /begawan deru utama/i },
  { path: "/contact", heading: /hubungi kami/i },
];

test.describe("halaman publik", () => {
  for (const { path, heading } of pages) {
    test(`${path} tampil dengan judul & tanpa error`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      expect(errors).toEqual([]);
    });
  }

  test("halaman yang tidak ada → 404 yang ramah", async ({ page }) => {
    const res = await page.goto("/halaman-yang-tidak-ada");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /tidak ditemukan/i })).toBeVisible();
  });

  test("cari produk & buka detail produk", async ({ page }) => {
    await page.goto("/products");
    const firstName = (await page.locator("article h3").first().textContent())!.trim();
    await page.getByPlaceholder(/cari produk/i).fill(firstName.split(" ")[0]!);
    await page.getByPlaceholder(/cari produk/i).press("Enter");
    await expect(page).toHaveURL(/q=/);
    await page.locator("article a").first().click();
    await expect(page).toHaveURL(/\/products\/[a-z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/termasuk ppn/i)).toBeVisible();
    // Data terstruktur produk untuk Google
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(ld!)).toEqual(expect.arrayContaining([expect.objectContaining({ "@type": "Product" })]));
  });

  test("formulir kontak memvalidasi isian", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: /kirim pesan/i }).click();
    // Validasi bawaan browser mencegah kirim form kosong
    await expect(page.locator("#name:invalid")).toHaveCount(1);
  });

  test("robots.txt & sitemap.xml tersedia", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Disallow: /admin");
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("/products/");
  });
});

test.describe("tampilan HP", () => {
  for (const { path } of pages) {
    test(`${path} tidak melebar ke samping @mobile`, async ({ page }) => {
      await page.goto(path);
      await expectNoHorizontalScroll(page);
    });
  }

  test("menu HP bisa dibuka & ditutup @mobile", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /buka menu/i }).click();
    await expect(page.locator("#mobile-menu").getByRole("link", { name: "Produk" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /buka menu/i })).toBeVisible();
  });
});
