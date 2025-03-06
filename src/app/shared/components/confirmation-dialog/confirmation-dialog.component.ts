import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";

@Component({
	selector: "app-confirmation-dialog",
	imports: [MatDialogModule, MatButtonModule],
	standalone: true,
	templateUrl: "./confirmation-dialog.component.html",
	styleUrl: "./confirmation-dialog.component.scss",
})
export class ConfirmationDialogComponent {
	constructor(private dialogRef: MatDialogRef<ConfirmationDialogComponent>) {}

	close(): void {
		this.dialogRef.close({ action: true });
	}
}
