import { DatePipe } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
	MAT_DIALOG_DATA,
	MatDialogActions,
	MatDialogContent,
	MatDialogRef,
	MatDialogTitle,
} from "@angular/material/dialog";
import { EventDialogModel } from "../../../core/models/event-dialog.model";

@Component({
	selector: "app-calendar-dialog-infos",
	imports: [
		MatButton,
		MatDialogActions,
		MatDialogContent,
		MatDialogTitle,
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

	close(): void {
		this.dialogRef.close({ action: true });
	}
}
