import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/lib/actions/auth";

/** Tombol keluar — memakai form + Server Action, jadi tetap bekerja tanpa JavaScript. */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="md">
        <LogOut className="h-4 w-4" aria-hidden="true" /> Keluar
      </Button>
    </form>
  );
}
