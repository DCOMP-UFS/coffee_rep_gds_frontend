/** Porte de `time.validators.ts` do frontend Angular. */

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: string): boolean {
	return TIME_PATTERN.test(value.trim());
}

function toMinutes(value: string): number {
	const [hours, minutes] = value.split(":").map(Number);
	return hours * 60 + minutes;
}

/**
 * Fim estritamente posterior ao início. Horários mal formatados não são comparados, para
 * que o erro mostrado seja o de formato, e não este.
 */
export function isEndAfterStart(start: string, end: string): boolean {
	if (!isValidTime(start) || !isValidTime(end)) return true;
	return toMinutes(end.trim()) > toMinutes(start.trim());
}
