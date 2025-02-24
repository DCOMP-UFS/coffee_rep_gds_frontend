import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSelectModule } from "@angular/material/select";
import { createDate, formatTimeRange } from "../../core/utils/utils";
import { CalendarComponent } from "../../shared/components/calendar/calendar.component";
import { HomeComponentStore } from "./home.store";

@Component({
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.scss"],
	standalone: true,
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
		CalendarComponent,
		MatCardModule,
	],
	providers: [HomeComponentStore],
})
export class HomeComponent {
	reservationForm: FormGroup;

	constructor(
		public homeStore: HomeComponentStore,
		private fb: FormBuilder,
	) {
		this.reservationForm = this.fb.group({
			section: ["", Validators.required],
			room: ["", Validators.required],
			reservationDate: [new Date(), Validators.required],
			timeRange: ["", Validators.required],
			requester: ["", Validators.required],
		});
	}

	getRoomsById(event: string): void {
		this.homeStore.setRoomsByFilter([]);
		this.homeStore.getRoomsBySectionId$({ sectionId: +event });
	}

	submitForm(): void {
		if (this.reservationForm.valid) {
			this.homeStore.createReservation$({
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

	protected readonly formatTimeRange = formatTimeRange;
}
