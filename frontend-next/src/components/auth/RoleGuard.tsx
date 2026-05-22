"use client";

/**
 * RoleGuard — Sayfa bazlı rol koruması
 *
 * Kullanım:
 *   <RoleGuard allowedRoles={["admin"]}>
 *     <AdminPage />
 *   </RoleGuard>
 *
 * - allowedRoles içindeki rollerden biri user.role ile eşleşmezse /login veya / yönlendirir.
 * - loadingUser durumunda skeleton gösterir.
 */

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ShieldAlert, Loader2 } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  redirectTo?: string;
}

export function RoleGuard({
  allowedRoles,
  children,
  redirectTo = "/",
}: RoleGuardProps) {
  const router = useRouter();
  const { user, isLoadingUser, isAuthenticated } = useAuthStore();

  const isAllowed = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (isLoadingUser) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isAllowed) {
      router.push(redirectTo);
    }
  }, [isLoadingUser, isAuthenticated, isAllowed, router, redirectTo]);

  if (isLoadingUser) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        <span className="text-sm">Yetki doğrulanıyor...</span>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-4 p-8">
        <div className="w-16 h-16 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Erişim Reddedildi</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bu sayfayı görüntülemek için gerekli yetkiye sahip değilsiniz.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
