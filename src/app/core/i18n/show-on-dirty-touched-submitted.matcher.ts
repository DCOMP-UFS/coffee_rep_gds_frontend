import { FormControl, FormGroupDirective, NgForm } from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";

export class ShowOnDirtyTouchedSubmittedMatcher implements ErrorStateMatcher {
	isErrorState(
		control: FormControl | null,
		form: FormGroupDirective | NgForm | null,
	): boolean {
		return !!(
			control?.invalid &&
			(control.dirty || control.touched || (form?.submitted ?? false))
		);
	}
}
