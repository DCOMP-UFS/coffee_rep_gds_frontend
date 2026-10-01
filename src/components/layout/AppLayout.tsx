import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PageSkeleton } from "@/components/feedback/PageSkeleton";
import { RouteErrorBoundary } from "@/components/feedback/RouteErrorBoundary";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AccessDialogProvider } from "@/features/session/access-dialog/AccessDialogProvider";
import { AppFooter } from "./AppFooter";
import { AppSidebar } from "./AppSidebar";
import { ColdStartBanner } from "./ColdStartBanner";

export const APP_TITLE = "Gerenciamento de salas – Ambulatório HU-UFS";

/** Casca das telas autenticadas: menu lateral, barra superior e área de conteúdo. */
export function AppLayout() {
	const { pathname } = useLocation();

	return (
		<SidebarProvider>
			<AccessDialogProvider>
				<AppSidebar />
				<SidebarInset className="min-w-0">
					<header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
						<SidebarTrigger aria-label="Alternar menu" />
						<Separator orientation="vertical" className="h-5!" />
						<span className="truncate text-sm font-semibold text-primary">{APP_TITLE}</span>
					</header>
					<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-8">
						<ColdStartBanner />
						<RouteErrorBoundary key={pathname}>
							<Suspense fallback={<PageSkeleton />}>
								<Outlet />
							</Suspense>
						</RouteErrorBoundary>
					</main>
					<AppFooter className="sticky bottom-0 z-20 border-t bg-background/85 py-2 backdrop-blur sm:flex-row sm:gap-3" />
				</SidebarInset>
			</AccessDialogProvider>
		</SidebarProvider>
	);
}
