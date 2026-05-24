import { AsyncPipe } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import {
	MatPaginator,
	MatPaginatorModule,
	PageEvent,
} from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { Requester } from "../../core/models/requester-response.model";
import { formatPhoneBr } from "../../core/utils/br-format.util";
import { ConfirmationDialogComponent } from "../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { RequesterDialogComponent } from "../../shared/components/requester-dialog/requester-dialog.component";
import { FORM_DIALOG_CONFIG } from "../../shared/constants/dialog-config";
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
		MatFormFieldModule,
		MatInputModule,
		ReactiveFormsModule,
		AsyncPipe,
		EmptyStateComponent,
	],
})
export class RequestersComponent implements OnInit {
	readonly formatPhone = formatPhoneBr;

	displayedColumns: string[] = [
		"nome",
		"telefone",
		"especialidade",
		"update",
		"delete",
	];
	dataSource = new MatTableDataSource<Requester>();
	requesterForm: FormGroup;
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	constructor(
		public store: RequestersComponentStore,
		private dialog: MatDialog,
		private fb: FormBuilder,
	) {
		this.requesterForm = this.fb.group({
			busca: [""],
		});
	}

	ngOnInit(): void {
		this.reloadRequesters(0, 5);
		this.store.getRequesters.subscribe((i) => {
			this.dataSource.data = i.content ?? [];
		});
	}

	search(): void {
		this.reloadRequesters(0, this.paginator?.pageSize ?? 5);
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
		this.reloadRequesters(e.pageIndex, e.pageSize);
	}

	private reloadRequesters(page: number, size: number): void {
		const busca = String(this.requesterForm.getRawValue().busca ?? "").trim();
		this.store.getRequester$({
			size,
			page,
			unpaged: false,
			...(busca ? { busca } : {}),
		});
	}
}
