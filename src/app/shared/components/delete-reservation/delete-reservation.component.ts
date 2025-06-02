import { Component } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
	MatDialogActions,
	MatDialogClose,
	MatDialogContent,
	MatDialogRef,
	MatDialogTitle,
} from "@angular/material/dialog";

@Component({
	selector: "app-delete-reservation",
	imports: [
		MatButton,
		MatDialogActions,
		MatDialogClose,
		MatDialogContent,
		MatDialogTitle,
	],
	templateUrl: "./delete-reservation.component.html",
	styleUrl: "./delete-reservation.component.scss",
})
export class DeleteReservationComponent {
	constructor(private dialogRef: MatDialogRef<DeleteReservationComponent>) {}

	close(type: string): void {
		this.dialogRef.close({ type });
	}
}
