import { Component, Input, OnInit, Optional } from "@angular/core";
import {
	ControlContainer,
	FormControl,
	FormGroup,
	FormGroupDirective,
	ReactiveFormsModule,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { shouldShowControlError } from "../../../core/utils/form-validation.util";
import { formatDateInput } from "../../../core/utils/utils";
import {
	datePartsToDate,
	parseBrDateParts,
} from "../../../core/validators/date-mask.validators";

@Component({
	selector: "app-masked-date-field",
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatButtonModule,
	],
	templateUrl: "./masked-date-field.component.html",
	styleUrl: "./masked-date-field.component.scss",
})
export class MaskedDateFieldComponent implements OnInit {
	@Input({ required: true }) controlName!: string;
	@Input() label = "Data";

	control!: FormControl<Date | null>;

	constructor(
		@Optional() private readonly controlContainer: ControlContainer,
		@Optional() private readonly parentForm: FormGroupDirective,
	) {}

	ngOnInit(): void {
		const group = this.controlContainer?.control as FormGroup | null;
		if (!group) {
			throw new Error(
				"app-masked-date-field must be used inside a parent form group.",
			);
		}

		const control = group.get(this.controlName);
		if (!control) {
			throw new Error(
				`Form control "${this.controlName}" not found for app-masked-date-field.`,
			);
		}

		this.control = control as FormControl<Date | null>;
	}

	get showError(): boolean {
		return shouldShowControlError(
			this.control,
			this.parentForm?.submitted ?? false,
		);
	}

	get showRequiredError(): boolean {
		return this.showError && !!this.control.hasError("required");
	}

	get showMaskError(): boolean {
		return (
			this.showError &&
			(!!this.control.hasError("dateMask") ||
				!!this.control.hasError("matDatepickerParse"))
		);
	}

	get showInvalidDateError(): boolean {
		return this.showError && !!this.control.hasError("dateInvalid");
	}

	onDateInput(event: Event): void {
		const input = event.target as HTMLInputElement;
		const formatted = formatDateInput(input.value);
		input.value = formatted;
		this.control.markAsDirty();

		if (!formatted.length) {
			this.control.setValue(null);
			return;
		}

		const parts = parseBrDateParts(formatted);
		if (parts && formatted.length === 10) {
			this.control.setValue(datePartsToDate(parts));
		}
	}
}
