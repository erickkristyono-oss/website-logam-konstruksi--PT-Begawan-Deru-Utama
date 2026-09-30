import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MailOpen } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { setMessageReadAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/dal";
import { cn } from "@/lib/utils/cn";
import { formatDateTime, formatNumber } from "@/lib/utils/format";
import { adminListQuerySchema } from "@/lib/validations/admin";
import { listMessages } from "@/services/admin/dashboard";

export const metadata: Metadata = { title: "Pesan — Admin", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminMessagesPage({ searchParams }: Props) {
  await requireAdmin("/admin/messages");
  const sp = await searchParams;
  const { page } = adminListQuerySchema.parse({ page: sp.page });
  const filter = sp.filter === "unread" ? "unread" : undefined;
  const data = await listMessages({ filter, page });
  const href = (p: number) => `/admin/messages?${new URLSearchParams({ ...(filter ? { filter } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <>
      <AdminPageHeader title="Pesan" description="Pesan dari formulir Kontak di website." />
      <div className="mb-4 flex gap-1.5">
        {[
          { key: undefined, label: "Semua" },
          { key: "unread", label: "Belum dibaca" },
        ].map((t) => (
          <Link
            key={t.label}
            href={t.key ? "/admin/messages?filter=unread" : "/admin/messages"}
            aria-current={filter === t.key ? "page" : undefined}
            className={cn(
              "inline-flex h-[36px] items-center rounded-full border px-3.5 text-[13px] font-medium",
              filter === t.key ? "border-ink bg-ink text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
        <span className="ml-auto self-center text-[13px] text-neutral-500">{formatNumber(data.total)} pesan</span>
      </div>

      {data.items.length === 0 ? (
        <p className="rounded-[16px] border border-neutral-200 bg-white px-5 py-10 text-center text-[14px] text-neutral-500">Tidak ada pesan.</p>
      ) : (
        <ul className="grid gap-3">
          {data.items.map((m) => (
            <li key={m.id} className={cn("rounded-[16px] border bg-white p-4 sm:p-5", m.isRead ? "border-neutral-200" : "border-brand/40 ring-1 ring-brand/10")}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    {!m.isRead && (
                      <>
                        <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
                        <span className="sr-only">Belum dibaca:</span>
                      </>
                    )}
                    <span className="font-medium text-neutral-950">{m.subject}</span>
                  </p>
                  <p className="text-[13px] text-neutral-600">
                    {m.name} ·{" "}
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="text-brand underline underline-offset-2">
                      {m.email}
                    </a>
                    {m.phone && (
                      <>
                        {" "}· <a href={`tel:${m.phone}`} className="hover:underline">{m.phone}</a>
                      </>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] text-neutral-500">{formatDateTime(m.createdAt)}</span>
              </div>
              <p className="mt-3 whitespace-pre-line break-words text-[14px] leading-relaxed text-neutral-800">{m.message}</p>
              <form action={setMessageReadAction.bind(null, m.id, !m.isRead)} className="mt-3">
                <button type="submit" className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] border border-neutral-300 px-3 text-[13px] hover:bg-neutral-100">
                  {m.isRead ? <Mail className="h-3.5 w-3.5" aria-hidden="true" /> : <MailOpen className="h-3.5 w-3.5" aria-hidden="true" />}
                  {m.isRead ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <Pagination page={data.page} totalPages={data.totalPages} hrefFor={href} />
      </div>
    </>
  );
}
