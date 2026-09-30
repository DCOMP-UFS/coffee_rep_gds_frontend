import {
	AlarmClock,
	Building2,
	CalendarDays,
	CalendarX2,
	DoorOpen,
	History,
	KeyRound,
	type LucideIcon,
	ShieldCheck,
	UserRound,
} from "lucide-react";
import type { Permission } from "@/features/session/types";

export type NavigationPath =
	| "/calendar"
	| "/sections"
	| "/rooms"
	| "/requester"
	| "/reservation"
	| "/absences"
	| "/historico"
	| "/meu-acesso"
	| "/admin";

export interface NavigationItem {
	label: string;
	path: NavigationPath;
	icon: LucideIcon;
	/** Sem ela o item some do menu e a rota mostra "Sem permissão". Ausente, todos acessam. */
	permission?: Permission;
}

/** Itens do menu lateral do Angular, mais os de acesso; "Sair" fica à parte, no rodapé. */
export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
	{ label: "Calendário", path: "/calendar", icon: CalendarDays },
	{ label: "Setores", path: "/sections", icon: Building2 },
	{ label: "Salas", path: "/rooms", icon: DoorOpen },
	{ label: "Solicitante", path: "/requester", icon: UserRound },
	{ label: "Reservas", path: "/reservation", icon: AlarmClock },
	{ label: "Ausências", path: "/absences", icon: CalendarX2 },
	{ label: "Histórico", path: "/historico", icon: History },
	{ label: "Meu acesso", path: "/meu-acesso", icon: KeyRound },
	{ label: "Administração", path: "/admin", icon: ShieldCheck, permission: "users.manage" },
];
