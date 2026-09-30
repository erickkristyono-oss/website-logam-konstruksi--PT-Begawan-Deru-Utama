/**
 * Data terstruktur (schema.org) untuk mesin pencari. Hanya berisi data nyata dari
 * lib/config/site.ts & database — tidak ada rating/ulasan karangan.
 * `<` di-escape agar isi tidak bisa menutup tag <script>.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
