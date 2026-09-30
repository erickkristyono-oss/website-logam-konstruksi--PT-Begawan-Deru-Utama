import { AlertCircle } from "lucide-react";

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-3 rounded-[12px] bg-red-50 p-4 text-[14px] text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </div>
  );
}
