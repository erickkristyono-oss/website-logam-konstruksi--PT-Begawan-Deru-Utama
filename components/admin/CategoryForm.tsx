"use client";

import { useActionState, useState } from "react";
import { saveCategoryAction, type AdminActionState } from "@/lib/actions/admin";
import { slugify } from "@/lib/validations/admin";

type Category = { id: string; name: string; slug: string; description: string | null; sortOrder: number; isActive: boolean };

const input =
  "h-[40px] w-full rounded-[10px] border border-neutral-300 bg-white px-3 text-[14px] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 aria-[invalid=true]:border-red-600";

/** Form tambah (category = null) atau edit kategori. */
export function CategoryForm({ category, onDone }: { category: Category | null; onDone?: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [description, setDescription] = useState(category?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    async (prev, fd) => {
      const res = await saveCategoryAction(category?.id ?? null, prev, fd);
      if (res.message && !category) {
        setName("");
        setSlug("");
        setDescription("");
        setSortOrder("0");
        setSlugTouched(false);
      }
      if (res.message) onDone?.();
      return res;
    },
    {},
  );
  const fe = state.fieldErrors ?? {};
  const idp = category?.id ?? "new";

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-[13px] font-medium text-neutral-800">
        Nama
        <input
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
          maxLength={80}
          aria-invalid={!!fe.name}
          className={input}
        />
        {fe.name && <span className="font-normal text-red-600">{fe.name}</span>}
      </label>
      <label className="grid gap-1 text-[13px] font-medium text-neutral-800">
        Slug
        <input
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase());
          }}
          maxLength={80}
          aria-invalid={!!fe.slug}
          className={input}
        />
        {fe.slug && <span className="font-normal text-red-600">{fe.slug}</span>}
      </label>
      <label className="grid gap-1 text-[13px] font-medium text-neutral-800 sm:col-span-2">
        Deskripsi singkat (opsional)
        <input name="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} className={input} />
      </label>
      <label className="grid gap-1 text-[13px] font-medium text-neutral-800">
        Urutan tampil
        <input
          name="sortOrder"
          inputMode="numeric"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value.replace(/[^\d]/g, ""))}
          className={input}
        />
      </label>
      <label className="flex items-center gap-2 self-end pb-2 text-[14px]" htmlFor={`active-${idp}`}>
        <input id={`active-${idp}`} type="checkbox" name="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Aktif (tampil di website)
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="h-[40px] rounded-[10px] bg-ink px-4 text-[14px] font-medium text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : category ? "Simpan" : "Tambah Kategori"}
        </button>
        {state.error && <p role="alert" className="text-[13px] text-red-700">{state.error}</p>}
        {state.message && !pending && <p role="status" className="text-[13px] text-green-700">{state.message}</p>}
      </div>
    </form>
  );
}
