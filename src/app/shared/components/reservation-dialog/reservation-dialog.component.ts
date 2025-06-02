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
import { MatSelectModule } from "@angular/material/select";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { createDate, formatTimeRange } from "../../../core/utils/utils";
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
		MatSelectModule,
		MatButtonModule,
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

	changeForm(event: boolean) {
		this.isRecurrentForm = !this.isRecurrentForm;
		this.daysPayload = [];
		if (!event) {
			this.reservationForm.removeControl("reservationDateFim");
		} else {
			this.reservationForm.addControl(
				"reservationDateFim",
				this.fb.control("", Validators.required),
			);
		}
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
		this.reservationForm = this.fb.group({
			section: ["", Validators.required],
			room: ["", Validators.required],
			reservationDate: ["", Validators.required],
			timeRange: ["", Validators.required],
			requester: ["", Validators.required],
		});
	}

	submitForm(): void {
		if (this.reservationForm.valid) {
			const request = {
				salaId: +this.reservationForm.value.room,
				solicitanteId: +this.reservationForm.value.requester,
				horaInicio: createDate(
					this.reservationForm.value.reservationDate,
					this.reservationForm.value.timeRange.split("-")[0],
				),
				horaFim: createDate(
					this.isRecurrentForm
						? this.reservationForm.value.reservationDate
						: this.reservationForm.value.reservationDateFim,
					this.reservationForm.value.timeRange.split("-")[1],
				),
				fixo: !this.isRecurrentForm,
				observacoes: "",
				dias: this.daysPayload,
			};
			if (this.isRecurrentForm) request.dias = undefined;
			this.reservationDialogComponentStore.createReservation$(request);
		}
	}

	getRoomsById(event: string): void {
		this.reservationDialogComponentStore.setRoomsByFilter([]);
		this.reservationDialogComponentStore.getRoomsBySectionId$({
			sectionId: +event,
		});
	}

	protected readonly formatTimeRange = formatTimeRange;
}
