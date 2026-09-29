import {
	AlarmClock,
	Building2,
	CalendarDays,
	CalendarX2,
	DoorOpen,
	History,
	type LucideIcon,
	UserRound,
} from "lucide-react";

export type NavigationPath =
	| "/calendar"
	| "/sections"
	| "/rooms"
	| "/requester"
	| "/reservation"
	| "/absences"
	| "/historico";

export interface NavigationItem {
	label: string;
	path: NavigationPath;
	icon: LucideIcon;
}

/** Mesmos itens e ordem do menu lateral do Angular; "Sair" fica à parte, no rodapé. */
export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
	{ label: "Calendário", path: "/calendar", icon: CalendarDays },
	{ label: "Setores", path: "/sections", icon: Building2 },
	{ label: "Salas", path: "/rooms", icon: DoorOpen },
	{ label: "Solicitante", path: "/requester", icon: UserRound },
	{ label: "Reservas", path: "/reservation", icon: AlarmClock },
	{ label: "Ausências", path: "/absences", icon: CalendarX2 },
	{ label: "Histórico", path: "/historico", icon: History },
];
