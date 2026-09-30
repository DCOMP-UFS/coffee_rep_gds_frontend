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

/** Telas autenticadas saem em arquivos próprios, baixados só na primeira visita à rota. */
const RoomsPage = lazy(() =>
	import("@/features/rooms/RoomsPage").then((module) => ({ default: module.RoomsPage })),
);
const SectionsPage = lazy(() =>
	import("@/features/sections/SectionsPage").then((module) => ({ default: module.SectionsPage })),
);
const RequestersPage = lazy(() =>
	import("@/features/requesters/RequestersPage").then((module) => ({
		default: module.RequestersPage,
	})),
);
const AbsencesPage = lazy(() =>
	import("@/features/absences/AbsencesPage").then((module) => ({ default: module.AbsencesPage })),
);

const ReservationsPage = lazy(() =>
	import("@/features/reservations/ReservationsPage").then((module) => ({
		default: module.ReservationsPage,
	})),
);
const HistoryPage = lazy(() =>
	import("@/features/audit/HistoryPage").then((module) => ({ default: module.HistoryPage })),
);
const CalendarPage = lazy(() =>
	import("@/features/calendar/CalendarPage").then((module) => ({ default: module.CalendarPage })),
);
const MyAccessPage = lazy(() =>
	import("@/features/my-access/MyAccessPage").then((module) => ({ default: module.MyAccessPage })),
);
const AdminPage = lazy(() =>
	import("@/features/admin/AdminPage").then((module) => ({ default: module.AdminPage })),
);

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

function pageFor({ path, permission }: NavigationItem): ReactNode {
	const page = PAGES[path];
	return permission ? <PermissionGate permission={permission}>{page}</PermissionGate> : page;
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
