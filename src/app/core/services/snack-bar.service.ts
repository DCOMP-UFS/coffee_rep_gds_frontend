import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";

export type SnackBarVariant = "success" | "error";

@Injectable({
	providedIn: "root",
})
export class SnackBarService {
	constructor(private snackBar: MatSnackBar) {}

	openSnackBar(message: string, variant: SnackBarVariant = "success"): void {
		this.snackBar.open(message, undefined, {
			horizontalPosition: "right",
			verticalPosition: "top",
			duration: 5 * 1000,
			panelClass:
				variant === "error" ? ["snackbar--error"] : ["snackbar--success"],
		});
	}
}
