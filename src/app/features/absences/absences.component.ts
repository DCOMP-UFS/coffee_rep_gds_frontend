import { Component, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { finalize } from "rxjs";
import { RequesterAbsence } from "../../core/models/requester-absence.model";
import { Requester } from "../../core/models/requester-response.model";
import { RequesterAbsenceHttpService } from "../../core/services/requester-absence-http.service";
import { RequesterService } from "../../core/services/requester.service";
import { SnackBarService } from "../../core/services/snack-bar.service";
import { ConfirmationDialogComponent } from "../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { ErrorStateComponent } from "../../shared/components/error-state/error-state.component";
import { TableSkeletonComponent } from "../../shared/components/table-skeleton/table-skeleton.component";
import { FORM_DIALOG_CONFIG_NARROW } from "../../shared/constants/dialog-config";
import { AbsenceDialogComponent } from "./absence-dialog.component";

@Component({
	selector: "app-absences",
	standalone: true,
	imports: [
		MatCardModule,
		MatTableModule,
		MatButtonModule,
		MatIconModule,
		EmptyStateComponent,
		ErrorStateComponent,
		TableSkeletonComponent,
	],
	templateUrl: "./absences.component.html",
	styleUrl: "./absences.component.scss",
})
export class AbsencesComponent implements OnInit {
	displayedColumns = ["profissional", "inicio", "fim", "actions"];
	dataSource = new MatTableDataSource<RequesterAbsence>();
	requesters: Requester[] = [];

	loading = true;
	error: string | null = null;

	constructor(
		private absenceApi: RequesterAbsenceHttpService,
		private requesterService: RequesterService,
		private dialog: MatDialog,
		private snackBar: SnackBarService,
	) {}

	ngOnInit(): void {
		this.requesterService.getRequesterUnpaged().subscribe({
			next: (list) => {
				this.requesters = Array.isArray(list) ? list : [];
				this.loadAbsences();
			},
			error: () => {
				this.requesters = [];
				this.loadAbsences();
			},
		});
	}

	loadAbsences(): void {
		this.loading = true;
		this.error = null;
		this.absenceApi
			.list()
			.pipe(
				finalize(() => {
					this.loading = false;
				}),
			)
			.subscribe({
				next: (rows) => {
					this.dataSource.data = rows ?? [];
				},
				error: () => {
					this.error =
						"Não foi possível carregar as ausências. Tente novamente.";
				},
			});
	}

	openDialog(row?: RequesterAbsence): void {
		this.dialog
			.open(AbsenceDialogComponent, {
				...FORM_DIALOG_CONFIG_NARROW,
				data: { requesters: this.requesters, element: row },
			})
			.afterClosed()
			.subscribe((ok) => {
				if (ok) {
					this.snackBar.openSnackBar("Registro salvo com sucesso.");
					this.loadAbsences();
				}
			});
	}

	delete(row: RequesterAbsence): void {
		this.dialog
			.open(ConfirmationDialogComponent)
			.afterClosed()
			.subscribe((r) => {
				if (!r?.action) return;
				this.absenceApi.delete(row.id).subscribe({
					next: () => {
						this.snackBar.openSnackBar("Ausência removida.");
						this.loadAbsences();
					},
					error: () =>
						this.snackBar.openSnackBar(
							"Não foi possível remover. Tente novamente.",
						),
				});
			});
	}

	fmt(d: string): string {
		if (!d) return "—";
		const [y, m, day] = d.split("-");
		return `${day}/${m}/${y}`;
	}
}
