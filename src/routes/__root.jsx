import { QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl text-brand">404</h1>
        <h2 className="mt-4 font-display text-2xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Looks like this dish isn't on our menu.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center rounded-full border border-input bg-background px-5 text-sm font-semibold hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
export const Route = createRootRouteWithContext()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

import { AuthProvider } from "@/lib/auth-context";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const isAdminDashboard = location.pathname === "/admin";

  return (
    <ThemeProvider defaultTheme="system" storageKey="flamebox-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              {!isAdminDashboard && <SiteHeader />}
              <main className="flex-1">
                <Outlet />
              </main>
              {!isAdminDashboard && <SiteFooter />}
            </div>
            <CartDrawer />
            <Toaster position="top-center" />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
