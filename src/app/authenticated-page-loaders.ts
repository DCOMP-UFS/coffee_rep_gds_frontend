import type { ComponentType } from "react";
import type { NavigationPath } from "@/components/layout/navigation";

/** Loader compatível com `React.lazy` (módulo com `default`). */
export type AuthenticatedPageLoader = () => Promise<{ default: ComponentType }>;

/**
 * Fonte única path → import() das telas autenticadas do menu.
 * Usado por `lazy()` nas rotas e por preload no menu / layout.
 */
export const AUTHENTICATED_PAGE_LOADERS: Record<NavigationPath, AuthenticatedPageLoader> = {
	"/calendar": () =>
		import("@/features/calendar/CalendarPage").then((module) => ({
			default: module.CalendarPage,
		})),
	"/sections": () =>
		import("@/features/sections/SectionsPage").then((module) => ({
			default: module.SectionsPage,
		})),
	"/rooms": () =>
		import("@/features/rooms/RoomsPage").then((module) => ({ default: module.RoomsPage })),
	"/requester": () =>
		import("@/features/requesters/RequestersPage").then((module) => ({
			default: module.RequestersPage,
		})),
	"/reservation": () =>
		import("@/features/reservations/ReservationsPage").then((module) => ({
			default: module.ReservationsPage,
		})),
	"/absences": () =>
		import("@/features/absences/AbsencesPage").then((module) => ({
			default: module.AbsencesPage,
		})),
	"/historico": () =>
		import("@/features/audit/HistoryPage").then((module) => ({ default: module.HistoryPage })),
	"/meu-acesso": () =>
		import("@/features/my-access/MyAccessPage").then((module) => ({
			default: module.MyAccessPage,
		})),
	"/admin": () =>
		import("@/features/admin/AdminPage").then((module) => ({ default: module.AdminPage })),
};

/** Dispara o download do chunk da rota (idempotente com o `lazy` correspondente). */
export function preloadAuthenticatedPage(path: NavigationPath): void {
	void AUTHENTICATED_PAGE_LOADERS[path]();
}
