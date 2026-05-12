export function formatTimeValue(value: string): string {
	let digits = value.replace(/\D/g, "");
	if (digits.length > 4) {
		digits = digits.substring(0, 4);
	}

	let hours = digits.substring(0, 2);
	let minutes = digits.substring(2, 4);

	if (hours && Number.parseInt(hours, 10) > 23) {
		hours = "23";
	}
	if (minutes && Number.parseInt(minutes, 10) > 59) {
		minutes = "59";
	}

	if (digits.length <= 2) {
		return hours;
	}

	return `${hours}:${minutes}`;
}

/** @deprecated Use formatTimeValue with separate start/end fields. */
export function formatTimeRange(input: HTMLInputElement): void {
	input.value = formatTimeValue(input.value);
}

export function createDate(dateObj: Date, timeString: string): string {
	const [hours, minutes] = timeString.split(":").map(Number);
	return formatDateToISO(new Date(dateObj.setHours(hours, minutes, 0, 0)));
}

export function formatDateToISO(date: Date): string {
	const pad = (num: number, size = 2) => num.toString().padStart(size, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
