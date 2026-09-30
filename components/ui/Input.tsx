import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed disabled:bg-neutral-100 aria-[invalid=true]:border-red-600";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-[48px]", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(fieldBase, "min-h-[140px] py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
};

/** Label + input + pesan error/hint yang terhubung (aksesibel). */
export function Field({ id, label, required, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-medium text-neutral-800">
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
