import { Component, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { finalize } from "rxjs";
import { Section } from "../../core/models/section-response.model";
import { SectionService } from "../../core/services/section.service";
import { SnackBarService } from "../../core/services/snack-bar.service";
import { ConfirmationDialogComponent } from "../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { ErrorStateComponent } from "../../shared/components/error-state/error-state.component";
import { TableSkeletonComponent } from "../../shared/components/table-skeleton/table-skeleton.component";
import { SectionDialogComponent } from "./section-dialog.component";

@Component({
	selector: "app-sections",
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
	templateUrl: "./sections.component.html",
	styleUrl: "./sections.component.scss",
})
export class SectionsComponent implements OnInit {
	displayedColumns = ["nome", "observacoes", "actions"];
	dataSource = new MatTableDataSource<Section>();
	loading = true;
	error: string | null = null;

	constructor(
		private sectionService: SectionService,
		private dialog: MatDialog,
		private snackBar: SnackBarService,
	) {}

	ngOnInit(): void {
		this.reload();
	}

	reload(): void {
		this.loading = true;
		this.error = null;
		this.sectionService
			.getSections()
			.pipe(finalize(() => (this.loading = false)))
			.subscribe({
				next: (res) => {
					this.dataSource.data = res.content ?? [];
				},
				error: () => {
					this.error =
						"Não foi possível carregar os setores. Tente novamente.";
				},
			});
	}

	openDialog(row?: Section): void {
		this.dialog
			.open(SectionDialogComponent, {
				width: "min(95vw, 460px)",
				data: { element: row },
			})
			.afterClosed()
			.subscribe((ok) => {
				if (ok) {
					this.snackBar.openSnackBar("Setor salvo com sucesso.");
					this.reload();
				}
			});
	}

	delete(row: Section): void {
		this.dialog
			.open(ConfirmationDialogComponent)
			.afterClosed()
			.subscribe((r) => {
				if (!r?.action) return;
				this.sectionService.deleteSection(row.id).subscribe({
					next: () => {
						this.snackBar.openSnackBar("Setor removido.");
						this.reload();
					},
					error: () =>
						this.snackBar.openSnackBar(
							"Não foi possível remover o setor.",
						),
				});
			});
	}
}
