export function formatTimeRange(input: HTMLInputElement): void {
	let value = input.value.replace(/\D/g, "");
	if (value.length > 8) {
		value = value.substring(0, 8);
	}

	let hh1 = value.substring(0, 2);
	let mm1 = value.substring(2, 4);
	let hh2 = value.substring(4, 6);
	let mm2 = value.substring(6, 8);

	if (Number.parseInt(hh1) > 23) hh1 = "23";
	if (Number.parseInt(hh2) > 23) hh2 = "23";
	if (Number.parseInt(mm1) > 59) mm1 = "59";
	if (Number.parseInt(mm2) > 59) mm2 = "59";

	let formattedValue = hh1;
	if (value.length > 2) formattedValue += `:${mm1}`;
	if (value.length > 4) formattedValue += ` - ${hh2}`;
	if (value.length > 6) formattedValue += `:${mm2}`;

	input.value = formattedValue;
}

export function createDate(dateObj: Date, timeString: string): string {
	const [hours, minutes] = timeString.split(":").map(Number);
	return formatDateToISO(new Date(dateObj.setHours(hours, minutes, 0, 0)));
}

export function formatDateToISO(date: Date): string {
	const pad = (num: number, size = 2) => num.toString().padStart(size, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
