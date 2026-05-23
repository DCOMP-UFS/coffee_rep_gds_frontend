import { ValidatorFn } from "@angular/forms";
import {
	brDateToIsoDate,
	dateMaskValidator,
	parseBrDateParts,
} from "./date-mask.validators";

export function birthDateMaskValidator(): ValidatorFn {
	return dateMaskValidator({ allowFuture: false });
}

export function birthDateBrToApi(value: string): string {
	return brDateToIsoDate(value);
}

export { parseBrDateParts };
