import { Injectable } from "@angular/core";
import { NativeDateAdapter } from "@angular/material/core";
import {
	datePartsToDate,
	isValidCalendarDate,
	parseBrDateParts,
} from "../validators/date-mask.validators";

@Injectable()
export class PtBrDateAdapter extends NativeDateAdapter {
	override parse(value: unknown): Date | null {
		if (value == null || value === "") {
			return null;
		}

		if (value instanceof Date) {
			return Number.isNaN(value.getTime()) ? null : value;
		}

		if (typeof value === "string") {
			const trimmed = value.trim();
			const parts = parseBrDateParts(trimmed);
			if (parts && isValidCalendarDate(parts)) {
				return datePartsToDate(parts);
			}

			const slashParts = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
			if (slashParts) {
				const parsed = {
					day: Number(slashParts[1]),
					month: Number(slashParts[2]),
					year: Number(slashParts[3]),
				};
				if (isValidCalendarDate(parsed)) {
					return datePartsToDate(parsed);
				}
			}
		}

		return super.parse(value);
	}

	override format(date: Date, displayFormat: unknown): string {
		if (
			displayFormat === "input" ||
			displayFormat === "DD/MM/YYYY" ||
			(typeof displayFormat === "object" &&
				displayFormat !== null &&
				"dateInput" in displayFormat)
		) {
			const pad = (num: number) => num.toString().padStart(2, "0");
			return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
		}

		return super.format(date, displayFormat);
	}
}
