import { DatePipe, NgClass } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
	MAT_DIALOG_DATA,
	MatDialogActions,
	MatDialogContent,
	MatDialogRef,
	MatDialogTitle,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { EventDialogModel } from "../../../core/models/event-dialog.model";

type ReservationTypeVariant = "punctual" | "recurrent" | "free";

@Component({
	selector: "app-calendar-dialog-infos",
	imports: [
		NgClass,
		MatButtonModule,
		MatDialogActions,
		MatDialogContent,
		MatDialogTitle,
		MatIconModule,
		DatePipe,
	],
	templateUrl: "./calendar-dialog-infos.component.html",
	styleUrl: "./calendar-dialog-infos.component.scss",
})
export class CalendarDialogInfosComponent {
	constructor(
		private dialogRef: MatDialogRef<CalendarDialogInfosComponent>,
		@Inject(MAT_DIALOG_DATA) public data: EventDialogModel,
	) {}

	get reservationTypeLabel(): string {
		if (this.data.profissionalAusente) {
			return "Livre (férias / ausência)";
		}

		if (this.data.recorrenciaId) {
			return "Recorrente";
		}

		return "Pontual";
	}

	get reservationTypeVariant(): ReservationTypeVariant {
		if (this.data.profissionalAusente) {
			return "free";
		}

		if (this.data.recorrenciaId) {
			return "recurrent";
		}

		return "punctual";
	}

	close(): void {
		this.dialogRef.close({ action: true });
	}
}
