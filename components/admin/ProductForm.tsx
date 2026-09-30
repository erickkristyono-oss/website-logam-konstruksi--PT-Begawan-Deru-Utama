"use client";

import { useActionState, useEffect, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { saveProductAction, type AdminActionState } from "@/lib/actions/admin";
import { cn } from "@/lib/utils/cn";
import { slugify } from "@/lib/validations/admin";
import type { AdminProduct } from "@/services/admin/catalog";

type Category = { id: string; name: string; isActive: boolean };

const input =
  "h-[44px] w-full rounded-[10px] border border-neutral-300 bg-white px-3 text-[15px] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 aria-[invalid=true]:border-red-600";

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-neutral-800">
      {children}
      {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
    </label>
  );
}

function Err({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={`${id}-error`} className="text-[13px] text-red-600">{msg}</p> : null;
}

/**
 * Form tambah/edit produk. Semua isian "controlled" supaya tidak hilang bila ada error
 * validasi dari server (foto perlu dipilih ulang karena browser tidak mengizinkan mengisi ulang input file).
 */
export function ProductForm({ product, categories }: { product: AdminProduct | null; categories: Category[] }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveProductAction.bind(null, product?.id ?? null), {});
  const fe = state.fieldErrors ?? {};

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [unit, setUnit] = useState(product?.unit ?? "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [specs, setSpecs] = useState(product?.specifications.length ? product.specifications : [{ label: "", value: "" }]);
  const [removeImage, setRemoveImage] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [sentFile, setSentFile] = useState(false);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const currentImage = removeImage ? null : (preview ?? product?.image ?? null);

  return (
    <form
      action={action}
      // Browser mengosongkan input file setelah form dikirim; bila server menolak,
      // pengguna diminta memilih ulang foto (pratinjau dibersihkan agar tidak menyesatkan).
      onSubmit={() => {
        setSentFile(Boolean(preview));
        setPreview(null);
      }}
      className="grid gap-6 xl:grid-cols-[1fr_340px]"
    >
      <div className="grid h-fit gap-6">
        <section className="grid gap-4 rounded-[16px] border border-neutral-200 bg-white p-4 sm:p-6">
          <h2 className="text-[16px] font-[450]">Informasi produk</h2>
          <div className="grid content-start gap-1.5">
            <Label htmlFor="name" required>Nama produk</Label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              maxLength={150}
              required
              aria-invalid={!!fe.name}
              className={input}
            />
            <Err id="name" msg={fe.name} />
          </div>
          <div className="grid content-start gap-1.5">
            <Label htmlFor="slug">Slug (alamat URL)</Label>
            <div className="flex items-center rounded-[10px] border border-neutral-300 bg-neutral-50 pl-3 focus-within:border-ink">
              <span className="shrink-0 text-[13px] text-neutral-500">/products/</span>
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase());
                }}
                maxLength={80}
                aria-invalid={!!fe.slug}
                className="h-[42px] min-w-0 flex-1 rounded-r-[10px] bg-white px-2 text-[15px] focus:outline-none"
              />
            </div>
            {product && slug !== product.slug && (
              <p className="text-[12px] text-amber-700">Mengubah slug membuat link lama ke produk ini tidak berlaku.</p>
            )}
            <Err id="slug" msg={fe.slug} />
          </div>
          <div className="grid content-start gap-1.5">
            <Label htmlFor="categoryId" required>Kategori</Label>
            <select
              id="categoryId"
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              aria-invalid={!!fe.categoryId}
              className={input}
            >
              <option value="">— Pilih kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isActive ? "" : " (nonaktif)"}
                </option>
              ))}
            </select>
            <Err id="categoryId" msg={fe.categoryId} />
          </div>
          <div className="grid content-start gap-1.5">
            <Label htmlFor="description" required>Deskripsi</Label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={5000}
              required
              aria-invalid={!!fe.description}
              className="w-full rounded-[10px] border border-neutral-300 px-3 py-2.5 text-[15px] leading-relaxed focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
            <Err id="description" msg={fe.description} />
          </div>
        </section>

        <section className="grid gap-4 rounded-[16px] border border-neutral-200 bg-white p-4 sm:p-6">
          <h2 className="text-[16px] font-[450]">Harga & stok</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid content-start gap-1.5">
              <Label htmlFor="price" required>Harga (Rp)</Label>
              <input
                id="price"
                name="price"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                required
                aria-invalid={!!fe.price}
                className={input}
              />
              <p className="text-[12px] text-neutral-500">Sudah termasuk PPN.</p>
              <Err id="price" msg={fe.price} />
            </div>
            <div className="grid content-start gap-1.5">
              <Label htmlFor="stock" required>Stok</Label>
              <input
                id="stock"
                name="stock"
                inputMode="numeric"
                value={stock}
                onChange={(e) => setStock(e.target.value.replace(/[^\d]/g, ""))}
                required
                aria-invalid={!!fe.stock}
                className={input}
              />
              <Err id="stock" msg={fe.stock} />
            </div>
            <div className="grid content-start gap-1.5">
              <Label htmlFor="unit" required>Satuan</Label>
              <input
                id="unit"
                name="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="batang / lembar / kg"
                maxLength={30}
                required
                aria-invalid={!!fe.unit}
                className={input}
              />
              <Err id="unit" msg={fe.unit} />
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-[16px] border border-neutral-200 bg-white p-4 sm:p-6">
          <div>
            <h2 className="text-[16px] font-[450]">Spesifikasi</h2>
            <p className="text-[13px] text-neutral-500">Mis. Diameter — 10 mm, Panjang — 12 m. Baris kosong diabaikan.</p>
          </div>
          {specs.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
              <input
                name="specLabel"
                aria-label={`Label spesifikasi ${i + 1}`}
                value={s.label}
                onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                placeholder="Label"
                maxLength={60}
                className={input}
              />
              <input
                name="specValue"
                aria-label={`Nilai spesifikasi ${i + 1}`}
                value={s.value}
                onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                placeholder="Nilai"
                maxLength={200}
                className={input}
              />
              <button
                type="button"
                onClick={() => setSpecs(specs.length > 1 ? specs.filter((_, j) => j !== i) : [{ label: "", value: "" }])}
                aria-label={`Hapus spesifikasi ${i + 1}`}
                className="flex h-[44px] w-[44px] items-center justify-center rounded-[10px] border border-neutral-300 text-neutral-500 hover:bg-neutral-100 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {specs.length < 30 && (
            <button
              type="button"
              onClick={() => setSpecs([...specs, { label: "", value: "" }])}
              className="inline-flex h-[40px] w-fit items-center gap-1.5 rounded-[10px] border border-dashed border-neutral-400 px-3 text-[14px] text-neutral-700 hover:border-ink"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Tambah baris
            </button>
          )}
          <Err id="specifications" msg={fe.specifications} />
        </section>
      </div>

      <div className="grid h-fit gap-6 xl:sticky xl:top-6">
        <section className="grid gap-3 rounded-[16px] border border-neutral-200 bg-white p-4 sm:p-6">
          <h2 className="text-[16px] font-[450]">Foto produk</h2>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-neutral-100">
            {currentImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- pratinjau lokal (blob:) sebelum diunggah
              <img src={currentImage} alt="Pratinjau foto produk" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-neutral-500">
                <ImagePlus className="h-8 w-8" aria-hidden="true" />
                <span className="text-[12px]">Belum ada foto</span>
              </div>
            )}
          </div>
          <label className="grid gap-1.5 text-[13px] font-medium text-neutral-800">
            {product?.image ? "Ganti foto" : "Unggah foto"}
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setRemoveImage(false);
                setPreview(f ? URL.createObjectURL(f) : null);
              }}
              className="text-[13px] font-normal file:mr-3 file:h-[36px] file:rounded-[8px] file:border-0 file:bg-neutral-100 file:px-3 file:text-[13px] file:font-medium hover:file:bg-neutral-200"
            />
          </label>
          <p className="text-[12px] text-neutral-500">JPG, PNG, atau WEBP, maks. 5 MB. Foto dikompres otomatis saat ditampilkan.</p>
          <Err id="image" msg={fe.image} />
          {product?.image && !preview && (
            <label className="flex items-center gap-2 text-[13px] text-neutral-700">
              <input type="checkbox" name="removeImage" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />
              Hapus foto
            </label>
          )}
        </section>

        <section className="grid gap-3 rounded-[16px] border border-neutral-200 bg-white p-4 sm:p-6">
          <h2 className="text-[16px] font-[450]">Tampilan</h2>
          <label className="flex items-start gap-2.5 text-[14px]">
            <input type="checkbox" name="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="mt-1" />
            <span>
              Aktif
              <span className="block text-[12px] text-neutral-500">Tampil di katalog dan bisa dibeli.</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-[14px]">
            <input type="checkbox" name="isFeatured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="mt-1" />
            <span>
              Produk unggulan
              <span className="block text-[12px] text-neutral-500">Ditampilkan di Beranda.</span>
            </span>
          </label>
        </section>

        <div className="grid gap-2">
          {state.error && (
            <p role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {state.error}
              {sentFile && !fe.image ? " Foto belum tersimpan — pilih ulang foto sebelum menyimpan." : ""}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "inline-flex h-[48px] items-center justify-center gap-2 rounded-[12px] bg-ink px-5 text-[15px] font-medium text-white hover:bg-ink-soft disabled:opacity-60",
            )}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {pending ? "Menyimpan..." : product ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
        </div>
      </div>
    </form>
  );
}
