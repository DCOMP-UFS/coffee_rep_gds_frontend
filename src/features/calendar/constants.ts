import type { StatusTone } from "@/components/status/StatusBadge";
import type { CalendarEventKind } from "./events";

/**
 * Cores do Angular (`CALENDAR_EVENT_COLORS`), com texto de contraste suficiente sobre cada uma.
 * As classes ficam escritas por inteiro para o Tailwind encontrá-las.
 */
export const EVENT_KIND_STYLES: Record<
	CalendarEventKind,
	{ chip: string; dot: string; tone: StatusTone }
> = {
	pontual: { chip: "bg-[#f9a825] text-neutral-900", dot: "bg-[#f9a825]", tone: "warning" },
	recorrente: { chip: "bg-[#c62828] text-white", dot: "bg-[#c62828]", tone: "danger" },
	livre: { chip: "bg-[#2e7d32] text-white", dot: "bg-[#2e7d32]", tone: "success" },
};

/** Eventos mostrados em cada dia antes do "+N mais". */
export const MAX_EVENTS_PER_DAY = 3;
