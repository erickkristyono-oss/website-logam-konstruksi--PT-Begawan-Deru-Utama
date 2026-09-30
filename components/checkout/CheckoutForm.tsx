"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { placeOrderAction, type CheckoutFormState } from "@/lib/actions/order";

type Defaults = { name: string; email: string; phone: string };

/**
 * Form data pengiriman. TIDAK mengirim barang / harga / total —
 * server mengambilnya sendiri dari keranjang & database.
 */
export function CheckoutForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction, pending] = useActionState<CheckoutFormState, FormData>(placeOrderAction, {});
  // Field yang sudah diperbaiki pengguna tidak lagi menampilkan error lama.
  const [edited, setEdited] = useState<{ state: CheckoutFormState; fields: Set<string> }>({ state, fields: new Set() });
  const editedFields = edited.state === state ? edited.fields : new Set<string>();
  const fe = Object.fromEntries(
    Object.entries(state.fieldErrors ?? {}).filter(([field]) => !editedFields.has(field)),
  ) as Record<string, string>;
  const markEdited = (e: React.FormEvent<HTMLFormElement>) => {
    const name = (e.target as HTMLInputElement).name;
    if (name && state.fieldErrors?.[name] && !editedFields.has(name)) {
      setEdited({ state, fields: new Set(editedFields).add(name) });
    }
  };
  const v: Record<string, string | undefined> = { ...defaults, ...state.values };
  const describedBy = (f: string) => (fe[f] ? `${f}-error` : undefined);

  return (
    <form action={formAction} onInput={markEdited} noValidate className="grid gap-5 sm:grid-cols-2">
      {state.error && (
        <div className="sm:col-span-2">
          <FormAlert message={state.error} />
          {state.cartProblem && (
            <Link href="/cart" className="mt-2 inline-block text-[14px] font-medium text-brand underline underline-offset-4">
              Buka keranjang
            </Link>
          )}
        </div>
      )}

      <Field id="name" label="Nama penerima" required error={fe.name}>
        <Input id="name" name="name" autoComplete="name" required maxLength={100} defaultValue={v.name}
          aria-invalid={!!fe.name} aria-describedby={describedBy("name")} />
      </Field>

      <Field id="phone" label="Telepon" required error={fe.phone}>
        <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={20}
          placeholder="08xx-xxxx-xxxx" defaultValue={v.phone} aria-invalid={!!fe.phone} aria-describedby={describedBy("phone")} />
      </Field>

      <div className="sm:col-span-2">
        <Field id="email" label="Email" required error={fe.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={v.email}
            aria-invalid={!!fe.email} aria-describedby={describedBy("email")} />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field id="address" label="Alamat lengkap" required hint="Nama jalan, nomor, RT/RW, kelurahan, kecamatan" error={fe.address}>
          <Textarea id="address" name="address" autoComplete="street-address" required maxLength={500} defaultValue={v.address}
            className="min-h-[100px]" aria-invalid={!!fe.address} aria-describedby={fe.address ? "address-error" : "address-hint"} />
        </Field>
      </div>

      <Field id="city" label="Kota / Kabupaten" required error={fe.city}>
        <Input id="city" name="city" autoComplete="address-level2" required maxLength={100} defaultValue={v.city}
          aria-invalid={!!fe.city} aria-describedby={describedBy("city")} />
      </Field>

      <Field id="postalCode" label="Kode pos" required error={fe.postalCode}>
        <Input id="postalCode" name="postalCode" inputMode="numeric" autoComplete="postal-code" required maxLength={5}
          pattern="\d{5}" defaultValue={v.postalCode} aria-invalid={!!fe.postalCode} aria-describedby={describedBy("postalCode")} />
      </Field>

      <div className="sm:col-span-2">
        <Field id="notes" label="Catatan" hint="Opsional — mis. waktu pengiriman atau patokan lokasi" error={fe.notes}>
          <Textarea id="notes" name="notes" maxLength={500} defaultValue={v.notes} className="min-h-[90px]"
            aria-invalid={!!fe.notes} aria-describedby={fe.notes ? "notes-error" : "notes-hint"} />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" variant="dark" size="lg" fullWidth disabled={pending} aria-busy={pending}>
          {pending ? "Membuat pesanan..." : "Buat Pesanan"}
        </Button>
        <p className="mt-3 text-center text-[13px] text-neutral-500">
          Dengan membuat pesanan, stok akan disiapkan untuk Anda. Pembayaran dilakukan setelah pesanan dibuat.
        </p>
      </div>
    </form>
  );
}
