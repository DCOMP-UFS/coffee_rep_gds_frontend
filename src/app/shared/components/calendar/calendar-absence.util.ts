import { RequesterAbsence } from "../../../core/models/requester-absence.model";

function toLocalDate(value: string): Date {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}

export function filterAbsencesInVisibleRange(
	absences: RequesterAbsence[],
	visibleStart: Date,
	visibleEnd: Date,
): RequesterAbsence[] {
	const rangeStart = startOfDay(visibleStart);
	const rangeEnd = startOfDay(addDays(visibleEnd, -1));

	return absences.filter((absence) => {
		const absenceStart = startOfDay(toLocalDate(absence.dataInicio));
		const absenceEnd = startOfDay(toLocalDate(absence.dataFim));
		return absenceStart <= rangeEnd && absenceEnd >= rangeStart;
	});
}

export function toExclusiveEndDate(isoDate: string): string {
	const exclusive = addDays(toLocalDate(isoDate), 1);
	const year = exclusive.getFullYear();
	const month = String(exclusive.getMonth() + 1).padStart(2, "0");
	const day = String(exclusive.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}
