import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSelectModule } from "@angular/material/select";
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
	],
	templateUrl: "./reservation-dialog.component.html",
	styleUrl: "./reservation-dialog.component.scss",
})
export class ReservationDialogComponent {
	reservationForm: FormGroup;

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
			this.reservationDialogComponentStore.createReservation$({
				salaId: +this.reservationForm.value.room,
				solicitanteId: +this.reservationForm.value.requester,
				horaInicio: createDate(
					this.reservationForm.value.reservationDate,
					this.reservationForm.value.timeRange.split("-")[0],
				),
				horaFim: createDate(
					this.reservationForm.value.reservationDate,
					this.reservationForm.value.timeRange.split("-")[1],
				),
				observacoes: "",
			});
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
