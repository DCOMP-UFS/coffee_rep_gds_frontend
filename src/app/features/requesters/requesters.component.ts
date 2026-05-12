import { AsyncPipe } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import {
	MatPaginator,
	MatPaginatorModule,
	PageEvent,
} from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { Requester } from "../../core/models/requester-response.model";
import { formatCpfBr, formatPhoneBr } from "../../core/utils/br-format.util";
import { ConfirmationDialogComponent } from "../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { FORM_DIALOG_CONFIG } from "../../shared/constants/dialog-config";
import { RequesterDialogComponent } from "../../shared/components/requester-dialog/requester-dialog.component";
import { RequestersComponentStore } from "./requesters.store";

@Component({
	selector: "app-requesters",
	standalone: true,
	templateUrl: "./requesters.component.html",
	providers: [RequestersComponentStore],
	styleUrl: "./requesters.component.scss",
	imports: [
		MatCardModule,
		MatButtonModule,
		MatTableModule,
		MatIconModule,
		MatPaginatorModule,
		MatDialogModule,
		AsyncPipe,
		EmptyStateComponent,
	],
})
export class RequestersComponent implements OnInit {
	readonly formatCpf = formatCpfBr;
	readonly formatPhone = formatPhoneBr;

	displayedColumns: string[] = [
		"nome",
		"telefone",
		"cpf",
		"especialidade",
		"update",
		"delete",
	];
	dataSource = new MatTableDataSource<Requester>();
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	constructor(
		public store: RequestersComponentStore,
		private dialog: MatDialog,
	) {}

	ngOnInit(): void {
		this.store.getRequester$({
			size: 5,
			page: 0,
			unpaged: false,
		});
		this.store.getRequesters.subscribe((i) => {
			this.dataSource.data = i.content ?? [];
		});
	}

	openDialog(): void {
		const dialog = this.dialog.open(RequesterDialogComponent, {
			...FORM_DIALOG_CONFIG,
		});

		dialog.afterClosed().subscribe((saved) => {
			if (saved) this.store.refetch();
		});
	}

	openDialogUpdate(element: Requester): void {
		const dialog = this.dialog.open(RequesterDialogComponent, {
			...FORM_DIALOG_CONFIG,
			data: { element },
		});

		dialog.afterClosed().subscribe((saved) => {
			if (saved) this.store.refetch();
		});
	}

	deleteRequester(element: Requester) {
		const dialog = this.dialog.open(ConfirmationDialogComponent);
		dialog
			.afterClosed()
			.subscribe(
				(i) =>
					i.action && this.store.deleteRequester$({ requesterId: element.id }),
			);
	}

	handlePageEvent(e: PageEvent) {
		this.store.getRequester$({
			size: e.pageSize,
			page: e.pageIndex,
			unpaged: false,
		});
	}
}
