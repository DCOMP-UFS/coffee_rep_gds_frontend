import { lazy, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import {
	NAVIGATION_ITEMS,
	type NavigationItem,
	type NavigationPath,
} from "@/components/layout/navigation";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { LoginPage } from "@/features/auth/LoginPage";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { SignUpPage } from "@/features/auth/SignUpPage";
import { NotFoundPage } from "@/features/not-found/NotFoundPage";
import { PermissionGate } from "@/features/session/PermissionGate";
import { AUTHENTICATED_PAGE_LOADERS } from "./authenticated-page-loaders";

/** Telas autenticadas saem em arquivos próprios, baixados só na primeira visita à rota. */
const RoomsPage = lazy(AUTHENTICATED_PAGE_LOADERS["/rooms"]);
const SectionsPage = lazy(AUTHENTICATED_PAGE_LOADERS["/sections"]);
const RequestersPage = lazy(AUTHENTICATED_PAGE_LOADERS["/requester"]);
const AbsencesPage = lazy(AUTHENTICATED_PAGE_LOADERS["/absences"]);
const ReservationsPage = lazy(AUTHENTICATED_PAGE_LOADERS["/reservation"]);
const HistoryPage = lazy(AUTHENTICATED_PAGE_LOADERS["/historico"]);
const CalendarPage = lazy(AUTHENTICATED_PAGE_LOADERS["/calendar"]);
const MyAccessPage = lazy(AUTHENTICATED_PAGE_LOADERS["/meu-acesso"]);
const AdminPage = lazy(AUTHENTICATED_PAGE_LOADERS["/admin"]);

/** Tela de cada item do menu; o tipo obriga que nenhum item fique sem tela. */
const PAGES: Record<NavigationPath, ReactNode> = {
	"/sections": <SectionsPage />,
	"/rooms": <RoomsPage />,
	"/requester": <RequestersPage />,
	"/absences": <AbsencesPage />,
	"/reservation": <ReservationsPage />,
	"/historico": <HistoryPage />,
	"/calendar": <CalendarPage />,
	"/meu-acesso": <MyAccessPage />,
	"/admin": <AdminPage />,
};

function pageFor({ path, restriction }: NavigationItem): ReactNode {
	const page = PAGES[path];
	return restriction ? (
		<PermissionGate permission={restriction.permission} feature={restriction.feature}>
			{page}
		</PermissionGate>
	) : (
		page
	);
}

/** Mesmas rotas do `app.routes.ts` do Angular, mais a página 404. */
export function AppRoutes() {
	return (
		<Routes>
			<Route element={<AuthLayout />}>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/cadastro" element={<SignUpPage />} />
			</Route>

			<Route element={<ProtectedRoute />}>
				<Route element={<AppLayout />}>
					<Route index element={<Navigate to="/rooms" replace />} />
					{NAVIGATION_ITEMS.map((item) => (
						<Route key={item.path} path={item.path} element={pageFor(item)} />
					))}
				</Route>
			</Route>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
}
