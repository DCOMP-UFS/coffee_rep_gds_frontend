import { AbstractControl, ValidationErrors } from "@angular/forms";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function timeFormatValidator(
	control: AbstractControl,
): ValidationErrors | null {
	const value = String(control.value ?? "").trim();
	if (!value) {
		return null;
	}
	return TIME_PATTERN.test(value) ? null : { timeFormat: true };
}

export function endTimeAfterStartValidator(
	group: AbstractControl,
): ValidationErrors | null {
	const start = String(group.get("horaInicio")?.value ?? "").trim();
	const end = String(group.get("horaFim")?.value ?? "").trim();
	if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
		return null;
	}

	const [startHours, startMinutes] = start.split(":").map(Number);
	const [endHours, endMinutes] = end.split(":").map(Number);
	const startTotal = startHours * 60 + startMinutes;
	const endTotal = endHours * 60 + endMinutes;

	return endTotal > startTotal ? null : { endBeforeStart: true };
}
