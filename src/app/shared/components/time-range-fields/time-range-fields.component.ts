import { Component, HostBinding, Input, OnInit, Optional } from "@angular/core";
import {
	ControlContainer,
	FormControl,
	FormGroup,
	ReactiveFormsModule,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { formatTimeValue } from "../../../core/utils/utils";

@Component({
	selector: "app-time-range-fields",
	standalone: true,
	imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
	templateUrl: "./time-range-fields.component.html",
	styleUrl: "./time-range-fields.component.scss",
})
export class TimeRangeFieldsComponent implements OnInit {
	@Input() startControlName = "horaInicio";
	@Input() endControlName = "horaFim";
	@Input() compact = false;

	@HostBinding("class.time-range-fields--compact")
	get isCompact(): boolean {
		return this.compact;
	}

	startControl!: FormControl<string>;
	endControl!: FormControl<string>;

	constructor(
		@Optional() private readonly controlContainer: ControlContainer,
	) {}

	ngOnInit(): void {
		const group = this.controlContainer?.control as FormGroup | null;
		if (!group) {
			throw new Error(
				"app-time-range-fields must be used inside a parent form group.",
			);
		}

		this.startControl = group.get(this.startControlName) as FormControl<string>;
		this.endControl = group.get(this.endControlName) as FormControl<string>;
	}

	onTimeInput(control: FormControl<string>, event: Event): void {
		const input = event.target as HTMLInputElement;
		const formatted = formatTimeValue(input.value);
		control.setValue(formatted, { emitEvent: true });
		input.value = formatted;
	}
}
