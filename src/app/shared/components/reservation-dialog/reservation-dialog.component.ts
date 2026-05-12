import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatChipListbox, MatChipOption } from "@angular/material/chips";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { createDate } from "../../../core/utils/utils";
import {
	endTimeAfterStartValidator,
	timeFormatValidator,
} from "../../../core/validators/time.validators";
import { SearchableSelectFieldComponent } from "../searchable-select-field/searchable-select-field.component";
import {
	mapRequesterOptions,
	mapRoomOptions,
	mapSectionOptions,
} from "../searchable-select-field/searchable-select-options.util";
import { TimeRangeFieldsComponent } from "../time-range-fields/time-range-fields.component";
import { ReservationDialogComponentStore } from "./reservation-dialog.store";

@Component({
	selector: "app-reservation-dialog",
	standalone: true,
	providers: [ReservationDialogComponentStore],
	imports: [
		AsyncPipe,
		MatIconModule,
		MatInputModule,
		MatPaginatorModule,
		MatFormFieldModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatButtonModule,
		SearchableSelectFieldComponent,
		TimeRangeFieldsComponent,
		ReactiveFormsModule,
		MatDialogModule,
		MatSlideToggle,
		MatChipListbox,
		MatChipOption,
	],
	templateUrl: "./reservation-dialog.component.html",
	styleUrl: "./reservation-dialog.component.scss",
})
export class ReservationDialogComponent {
	reservationForm: FormGroup;
	protected readonly mapSectionOptions = mapSectionOptions;
	protected readonly mapRoomOptions = mapRoomOptions;
	protected readonly mapRequesterOptions = mapRequesterOptions;
	readonly daysOfWeek: { day: string; value: number }[] = [
		{ day: "Segunda", value: 1 },
		{ day: "Terça", value: 2 },
		{ day: "Quarta", value: 3 },
		{ day: "Quinta", value: 4 },
		{ day: "Sexta", value: 5 },
		{ day: "Sábado", value: 6 },
	];
	isRecurrentForm = true;
	daysPayload: number[] = [];

	changeForm(isRecorrente: boolean) {
		this.isRecurrentForm = isRecorrente;
		this.daysPayload = [];
		if (!isRecorrente) {
			this.reservationForm.removeControl("reservationDateFim");
			return;
		}
		this.reservationForm.addControl(
			"reservationDateFim",
			this.fb.control("", Validators.required),
		);
	}

	saveReservation(dayNumber: number) {
		const index = this.daysPayload.indexOf(dayNumber);
		if (index !== -1) {
			this.daysPayload.splice(index, 1);
		} else this.daysPayload.push(dayNumber);
	}

	constructor(
		public reservationDialogComponentStore: ReservationDialogComponentStore,
		private fb: FormBuilder,
	) {
		this.reservationForm = this.fb.group(
			{
				section: ["", Validators.required],
				room: ["", Validators.required],
				reservationDate: ["", Validators.required],
				horaInicio: ["", [Validators.required, timeFormatValidator]],
				horaFim: ["", [Validators.required, timeFormatValidator]],
				requester: ["", Validators.required],
			},
			{ validators: endTimeAfterStartValidator },
		);
		this.changeForm(this.isRecurrentForm);
	}

	submitForm(): void {
		if (this.reservationForm.valid) {
			const request = {
				salaId: +this.reservationForm.value.room,
				solicitanteId: +this.reservationForm.value.requester,
				horaInicio: createDate(
					this.reservationForm.value.reservationDate,
					this.reservationForm.value.horaInicio,
				),
				horaFim: createDate(
					this.isRecurrentForm
						? this.reservationForm.value.reservationDateFim
						: this.reservationForm.value.reservationDate,
					this.reservationForm.value.horaFim,
				),
				fixo: this.isRecurrentForm,
				observacoes: "",
				dias: this.daysPayload,
			};
			if (!this.isRecurrentForm) request.dias = undefined;
			this.reservationDialogComponentStore.createReservation$(request);
		}
	}

	getRoomsById(event: string | number): void {
		this.reservationForm.patchValue({ room: "" });
		this.reservationDialogComponentStore.setRoomsByFilter([]);
		this.reservationDialogComponentStore.getRoomsBySectionId$({
			sectionId: +event,
		});
	}
}
