import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clearFailures, isBlocked, recordFailure } from "@/lib/utils/rate-limit";

describe("password (scrypt)", () => {
  it("hash tidak sama dengan password & bisa diverifikasi", async () => {
    const hash = await hashPassword("Rahasia123");
    expect(hash).not.toContain("Rahasia123");
    expect(await verifyPassword("Rahasia123", hash)).toBe(true);
    expect(await verifyPassword("rahasia123", hash)).toBe(false);
  });
  it("hash berbeda untuk password yang sama (salt acak)", async () => {
    expect(await hashPassword("Sama12345")).not.toBe(await hashPassword("Sama12345"));
  });
  it("hash rusak tidak dianggap cocok", async () => {
    expect(await verifyPassword("apa", "bukan-hash")).toBe(false);
  });
});

describe("pembatasan percobaan login", () => {
  it("memblokir setelah batas kegagalan & bisa direset", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) recordFailure(key, 60_000);
    expect(isBlocked(key, 3)).toBe(true);
    clearFailures(key);
    expect(isBlocked(key, 3)).toBe(false);
  });
});

describe("upload foto produk", () => {
  let storage: typeof import("@/lib/storage");
  let dir: string;

  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), "uploads-"));
    process.env.UPLOAD_DIR = dir;
    storage = await import("@/lib/storage");
  });

  const jpg = () => new File([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46])], "foto.jpg");
  const png = () => new File([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])], "foto.png");

  it("menyimpan JPG/PNG asli dengan nama acak", async () => {
    const a = await storage.saveProductImage(jpg(), "Besi Beton!");
    const b = await storage.saveProductImage(png(), "besi-beton");
    expect(a).toMatch(/^\/uploads\/products\/besi-beton-[a-f0-9]{8}\.jpg$/);
    expect(b).toMatch(/\.png$/);
    expect(readdirSync(path.join(dir, "products"))).toHaveLength(2);
  });

  it("menolak file yang hanya berganti nama menjadi .jpg", async () => {
    await expect(storage.saveProductImage(new File(["bukan gambar"], "x.jpg"), "x")).rejects.toThrow(/JPG, PNG, atau WEBP/);
  });

  it("menolak file > 5 MB", async () => {
    const big = new File([new Uint8Array(storage.MAX_IMAGE_BYTES + 1)], "big.jpg");
    await expect(storage.saveProductImage(big, "x")).rejects.toThrow(/5 MB/);
  });

  it("nama file berbahaya tidak menghasilkan path", () => {
    expect(storage.productImagePath("../../.env.local")).toBeNull();
    expect(storage.productImagePath("x.svg")).toBeNull();
    expect(storage.productImagePath("besi-a1b2c3d4.jpg")).toContain(path.join("products", "besi-a1b2c3d4.jpg"));
  });

  it("menghapus hanya file upload, bukan ilustrasi bawaan", async () => {
    const url = await storage.saveProductImage(jpg(), "hapus");
    const before = readdirSync(path.join(dir, "products")).length;
    await storage.deleteUploadedImage("/images/products/besi.svg");
    await storage.deleteUploadedImage("/uploads/products/../../../etc/passwd");
    expect(readdirSync(path.join(dir, "products"))).toHaveLength(before);
    await storage.deleteUploadedImage(url);
    expect(readdirSync(path.join(dir, "products"))).toHaveLength(before - 1);
  });
});
