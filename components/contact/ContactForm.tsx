"use client";

// Client Component: butuh state (loading/sukses/error) dan interaksi form.

import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import {
  contactSchema,
  toFieldErrors,
  type ContactField,
  type ContactFieldErrors,
} from "@/lib/validations/contact";

type Status =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success" }
  | { type: "error"; message: string };

type ApiResponse = { ok: boolean; error?: string; fieldErrors?: ContactFieldErrors };

const FIELDS: ContactField[] = ["name", "email", "phone", "subject", "message", "website"];

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [errors, setErrors] = useState<ContactFieldErrors>({});

  function readForm(form: HTMLFormElement): Record<ContactField, string> {
    const data = new FormData(form);
    return Object.fromEntries(FIELDS.map((f) => [f, String(data.get(f) ?? "")])) as Record<ContactField, string>;
  }

  function focusFirstError(fieldErrors: ContactFieldErrors) {
    const first = FIELDS.find((f) => fieldErrors[f] && f !== "website");
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.type === "submitting") return;

    const values = readForm(event.currentTarget);

    // Validasi cepat di browser (server tetap memvalidasi ulang).
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      setErrors(fieldErrors);
      setStatus({ type: "idle" });
      focusFirstError(fieldErrors);
      return;
    }

    setErrors({});
    setStatus({ type: "submitting" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json().catch(() => ({ ok: false }))) as ApiResponse;

      if (res.ok && json.ok) {
        formRef.current?.reset();
        setStatus({ type: "success" });
        return;
      }
      if (json.fieldErrors) {
        setErrors(json.fieldErrors);
        focusFirstError(json.fieldErrors);
      }
      setStatus({ type: "error", message: json.error ?? "Pesan gagal dikirim. Silakan coba lagi." });
    } catch {
      setStatus({ type: "error", message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda." });
    }
  }

  /** Hapus error sebuah field saat pengguna mulai memperbaikinya. */
  function clearError(field: ContactField) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const describedBy = (field: ContactField) => (errors[field] ? `${field}-error` : undefined);
  const isSubmitting = status.type === "submitting";

  if (status.type === "success") {
    return (
      <div role="status" className="mt-6 flex flex-col items-start gap-4 rounded-[16px] bg-green-50 p-6 text-green-900">
        <CheckCircle2 className="h-8 w-8 text-green-700" aria-hidden="true" />
        <div>
          <p className="text-[18px] font-medium">Pesan terkirim</p>
          <p className="mt-1 text-[15px] text-green-800">
            Terima kasih telah menghubungi kami. Tim kami akan segera membalas pesan Anda.
          </p>
        </div>
        <Button variant="outline" size="md" onClick={() => setStatus({ type: "idle" })}>
          Kirim pesan lain
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
      {status.type === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[12px] bg-red-50 p-4 text-[14px] text-red-800 sm:col-span-2"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {status.message}
        </div>
      )}

      <Field id="name" label="Nama" required error={errors.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name")}
          onChange={() => clearError("name")}
        />
      </Field>

      <Field id="email" label="Email" required error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email")}
          onChange={() => clearError("email")}
        />
      </Field>

      <Field id="phone" label="Telepon" hint="Opsional" error={errors.phone}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          placeholder="08xx-xxxx-xxxx"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
          onChange={() => clearError("phone")}
        />
      </Field>

      <Field id="subject" label="Subjek" required error={errors.subject}>
        <Input
          id="subject"
          name="subject"
          required
          maxLength={150}
          placeholder="Mis. Permintaan penawaran pipa galvanis"
          aria-invalid={!!errors.subject}
          aria-describedby={describedBy("subject")}
          onChange={() => clearError("subject")}
        />
      </Field>

      <div className="sm:col-span-2">
        <Field id="message" label="Pesan" required error={errors.message}>
          <Textarea
            id="message"
            name="message"
            required
            maxLength={2000}
            placeholder="Tuliskan kebutuhan material, jumlah, dan lokasi pengiriman."
            aria-invalid={!!errors.message}
            aria-describedby={describedBy("message")}
            onChange={() => clearError("message")}
          />
        </Field>
      </div>

      {/* Honeypot anti-spam: disembunyikan dari pengguna & pembaca layar. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-neutral-500">
          Kolom bertanda <span className="text-red-600">*</span> wajib diisi.
        </p>
        <Button type="submit" variant="dark" size="lg" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
        </Button>
      </div>
    </form>
  );
}
