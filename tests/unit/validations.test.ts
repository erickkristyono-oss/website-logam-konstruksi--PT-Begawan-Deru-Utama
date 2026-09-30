import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/validations/auth";
import { checkoutSchema } from "@/lib/validations/checkout";
import { adminCategorySchema, adminProductSchema, slugify } from "@/lib/validations/admin";
import { parseProductQuery } from "@/lib/validations/product";

const validCheckout = {
  name: "Budi",
  email: "Budi@Example.com",
  phone: "0812-3456-7890",
  address: "Jl. Contoh Raya No. 10, Pamulang",
  city: "Tangerang Selatan",
  postalCode: "15417",
  notes: "",
};

describe("checkoutSchema", () => {
  it("menerima data valid & menormalkan email", () => {
    const r = checkoutSchema.parse(validCheckout);
    expect(r.email).toBe("budi@example.com");
  });

  it.each(["081234567890", "+6281234567890", "62 812 3456 7890"])("menerima nomor Indonesia %s", (phone) => {
    expect(checkoutSchema.safeParse({ ...validCheckout, phone }).success).toBe(true);
  });

  it.each(["12345", "0212345678", "abc"])("menolak nomor %s", (phone) => {
    expect(checkoutSchema.safeParse({ ...validCheckout, phone }).success).toBe(false);
  });

  it("menolak kode pos bukan 5 digit & alamat terlalu pendek", () => {
    const r = checkoutSchema.safeParse({ ...validCheckout, postalCode: "1541", address: "Jl. A" });
    expect(r.success).toBe(false);
    const fields = r.error!.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["postalCode", "address"]));
  });

  it("mengabaikan field harga/total palsu dari browser", () => {
    const r = checkoutSchema.parse({ ...validCheckout, total: 1, price: 1 } as never);
    expect(r).not.toHaveProperty("total");
    expect(r).not.toHaveProperty("price");
  });
});

describe("safeCallbackUrl (anti open-redirect)", () => {
  it.each([
    ["/checkout", "/checkout"],
    ["https://evil.com", "/account"],
    ["//evil.com", "/account"],
    ["/\\evil.com", "/account"],
    [undefined, "/account"],
  ])("%s → %s", (input, expected) => {
    expect(safeCallbackUrl(input)).toBe(expected);
  });
});

describe("slugify", () => {
  it("membuat slug huruf kecil dengan tanda hubung", () => {
    expect(slugify("Besi Beton 10 mm")).toBe("besi-beton-10-mm");
    expect(slugify("  Pipa   Galvanis ½\" ")).toBe("pipa-galvanis-1-2");
    expect(slugify("Café & Kawat!!")).toBe("cafe-kawat");
  });
});

describe("adminProductSchema", () => {
  const base = {
    name: "Besi WF 150",
    slug: "",
    categoryId: "c1",
    description: "Besi profil WF untuk struktur.",
    price: "1250000",
    stock: "25",
    unit: "batang",
    specifications: [],
    isActive: "on",
    isFeatured: null,
    removeImage: null,
  };

  it("mengisi slug otomatis dari nama & mengubah angka/checkbox", () => {
    const r = adminProductSchema.parse(base);
    expect(r).toMatchObject({ slug: "besi-wf-150", price: 1_250_000, stock: 25, isActive: true, isFeatured: false });
  });

  it.each([
    [{ price: "12.5" }, "price"],
    [{ price: "0" }, "price"],
    [{ stock: "-1" }, "stock"],
    [{ slug: "Slug Salah!" }, "slug"],
    [{ description: "pendek" }, "description"],
  ])("menolak %o", (patch, field) => {
    const r = adminProductSchema.safeParse({ ...base, ...patch });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path[0]).toBe(field);
  });

  it("membatasi spesifikasi maksimal 30 baris", () => {
    const specs = Array.from({ length: 31 }, (_, i) => ({ label: `L${i}`, value: "v" }));
    expect(adminProductSchema.safeParse({ ...base, specifications: specs }).success).toBe(false);
  });
});

describe("adminCategorySchema", () => {
  it("slug otomatis & deskripsi kosong jadi null", () => {
    expect(adminCategorySchema.parse({ name: "Besi Profil", slug: "", description: "", sortOrder: "3", isActive: "on" })).toEqual({
      name: "Besi Profil",
      slug: "besi-profil",
      description: null,
      sortOrder: 3,
      isActive: true,
    });
  });
});

describe("parseProductQuery (URL katalog)", () => {
  it("nilai tidak valid kembali ke default, bukan error", () => {
    expect(parseProductQuery({ page: "-3", limit: "9999", category: "<script>" })).toMatchObject({ page: 1, category: undefined });
  });
  it("mengambil nilai pertama bila parameter ganda", () => {
    expect(parseProductQuery({ q: ["pipa", "besi"] }).q).toBe("pipa");
  });
});
