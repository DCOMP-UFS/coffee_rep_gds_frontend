import { addDays, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

/** Como o FullCalendar do Angular: sempre 6 semanas, de domingo a sábado. */
const WEEKS_PER_MONTH = 6;
const DAYS_PER_WEEK = 7;

export const WEEKDAY_SHORT_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export interface CalendarDay {
	date: Date;
	/** `AAAA-MM-DD` no horário local. */
	iso: string;
	inMonth: boolean;
	isToday: boolean;
}

export const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

function firstVisibleDay(month: Date): Date {
	return startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
}

/** Semanas exibidas para o mês, incluindo os dias dos meses vizinhos que completam a grade. */
export function buildMonthWeeks(month: Date, today: Date = new Date()): CalendarDay[][] {
	const first = firstVisibleDay(month);
	return Array.from({ length: WEEKS_PER_MONTH }, (_, week) =>
		Array.from({ length: DAYS_PER_WEEK }, (_, weekday) => {
			const date = addDays(first, week * DAYS_PER_WEEK + weekday);
			return {
				date,
				iso: toIsoDate(date),
				inMonth: isSameMonth(date, month),
				isToday: isSameDay(date, today),
			};
		}),
	);
}

/** Primeiro e último dia visíveis na grade, em datas ISO, inclusive nas duas pontas. */
export function visibleRange(month: Date): { inicio: string; fim: string } {
	const first = firstVisibleDay(month);
	return {
		inicio: toIsoDate(first),
		fim: toIsoDate(addDays(first, WEEKS_PER_MONTH * DAYS_PER_WEEK - 1)),
	};
}

/** "setembro de 2026". */
export const monthTitle = (month: Date) => format(month, "MMMM 'de' yyyy", { locale: ptBR });

/** "terça-feira, 29 de setembro de 2026". */
export const longDayLabel = (date: Date) =>
	format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
