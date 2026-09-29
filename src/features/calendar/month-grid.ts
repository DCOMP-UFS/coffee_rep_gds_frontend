import {
	addDays,
	format,
	isSameDay,
	isSameMonth,
	setMonth,
	setYear,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import type { FilterOption } from "@/components/filters/FilterSelect";

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

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Os 12 meses, com o índice do `Date` (`"0"` é janeiro) como valor. */
export const MONTH_OPTIONS: readonly FilterOption[] = Array.from({ length: 12 }, (_, index) => ({
	value: String(index),
	label: capitalize(format(new Date(2000, index, 1), "MMMM", { locale: ptBR })),
}));

/** Anos oferecidos no select, antes e depois do ano atual. */
export const YEARS_BEFORE = 5;
export const YEARS_AFTER = 5;

/**
 * Anos do select, em ordem crescente. As setas podem levar para fora do intervalo; nesse caso o
 * ano exibido entra na lista, para o select nunca ficar sem o valor selecionado.
 */
export function yearOptions(displayedYear: number, currentYear: number): FilterOption[] {
	const first = Math.min(currentYear - YEARS_BEFORE, displayedYear);
	const last = Math.max(currentYear + YEARS_AFTER, displayedYear);
	return Array.from({ length: last - first + 1 }, (_, index) => {
		const year = String(first + index);
		return { value: year, label: year };
	});
}

/** Mesmo ano, outro mês (índice do `Date`), sempre no dia 1. */
export const withMonth = (month: Date, monthIndex: number) =>
	startOfMonth(setMonth(startOfMonth(month), monthIndex));

/** Mesmo mês, outro ano, sempre no dia 1. */
export const withYear = (month: Date, year: number) =>
	startOfMonth(setYear(startOfMonth(month), year));
