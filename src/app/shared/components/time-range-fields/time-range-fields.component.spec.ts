import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormControl, ReactiveFormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { TimeRangeFieldsComponent } from "./time-range-fields.component";

@Component({
	standalone: true,
	imports: [ReactiveFormsModule, TimeRangeFieldsComponent],
	template: `
		<form [formGroup]="form">
			<app-time-range-fields />
		</form>
	`,
})
class TimeRangeFieldsHostComponent {
	form = this.fb.group({
		horaInicio: [""],
		horaFim: [""],
	});

	constructor(private readonly fb: FormBuilder) {}
}

describe("TimeRangeFieldsComponent", () => {
	let fixture: ComponentFixture<TimeRangeFieldsHostComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TimeRangeFieldsHostComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(TimeRangeFieldsHostComponent);
		fixture.detectChanges();
	});

	it("should format time input as HH:MM", () => {
		const fields = fixture.debugElement.query(
			By.directive(TimeRangeFieldsComponent),
		).componentInstance as TimeRangeFieldsComponent;
		const control = new FormControl("");
		const input = document.createElement("input");
		input.value = "0830";
		fields.onTimeInput(control, { target: input } as unknown as Event);
		expect(control.value).toBe("08:30");
	});
});
