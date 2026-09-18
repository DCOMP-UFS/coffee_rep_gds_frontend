import { AsyncPipe, DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatChip } from "@angular/material/chips";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { AuditEvent } from "../../core/models/audit-response.model";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { ErrorStateComponent } from "../../shared/components/error-state/error-state.component";
import { PaginationBarComponent } from "../../shared/components/pagination/pagination-bar.component";
import { PaginationPageChange } from "../../shared/components/pagination/pagination-page-change.model";
import { PaginationSummaryComponent } from "../../shared/components/pagination/pagination-summary.component";
import { TableSkeletonComponent } from "../../shared/components/table-skeleton/table-skeleton.component";
import {
	AUDIT_ACTION_FILTER_OPTIONS,
	AUDIT_ENTITY_FILTER_OPTIONS,
	auditActionLabel,
	auditEntityLabel,
	formatAuditDetails,
	isBackfillEvent,
} from "./audit-labels";
import { HistoricoComponentStore } from "./historico.store";

@Component({
	selector: "app-historico",
	imports: [
		MatTableModule,
		MatCardModule,
		MatIcon,
		MatDatepickerModule,
		MatNativeDateModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatButtonModule,
		MatChip,
		AsyncPipe,
		DatePipe,
		EmptyStateComponent,
		ErrorStateComponent,
		TableSkeletonComponent,
		PaginationBarComponent,
		PaginationSummaryComponent,
	],
	providers: [HistoricoComponentStore],
	standalone: true,
	templateUrl: "./historico.component.html",
	styleUrl: "./historico.component.scss",
})
export class HistoricoComponent implements OnInit {
	readonly actionOptions = AUDIT_ACTION_FILTER_OPTIONS;
	readonly entityOptions = AUDIT_ENTITY_FILTER_OPTIONS;
	readonly actionLabel = auditActionLabel;
	readonly entityLabel = auditEntityLabel;
	readonly detailsText = formatAuditDetails;
	readonly isBackfill = isBackfillEvent;

	displayedColumns: string[] = [
		"createdAt",
		"action",
		"entity",
		"actor",
		"details",
	];
	dataSource = new MatTableDataSource<AuditEvent>();
	pageSize = 10;
	pageIndex = 0;
	totalElements = 0;
	filterForm: FormGroup;

	constructor(
		public store: HistoricoComponentStore,
		private fb: FormBuilder,
	) {
		this.filterForm = this.fb.group({
			q: [""],
			action: [""],
			entityType: [""],
			createdFrom: [null as Date | null],
			createdTo: [null as Date | null],
		});
	}

	ngOnInit(): void {
		this.fetch(0, this.pageSize);
		this.store.getEvents.subscribe((page) => {
			this.dataSource.data = page.content ?? [];
			this.pageSize = page.page?.size ?? this.pageSize;
			this.pageIndex = page.page?.number ?? this.pageIndex;
			this.totalElements = page.page?.totalElements ?? 0;
		});
	}

	submit(): void {
		this.fetch(0, this.pageSize);
	}

	clearFilters(): void {
		this.filterForm.reset({
			q: "",
			action: "",
			entityType: "",
			createdFrom: null,
			createdTo: null,
		});
		this.fetch(0, this.pageSize);
	}

	reload(): void {
		this.fetch(this.pageIndex, this.pageSize);
	}

	handlePageEvent(e: PaginationPageChange): void {
		this.fetch(e.pageIndex, e.pageSize);
	}

	private fetch(page: number, size: number): void {
		this.pageIndex = page;
		this.pageSize = size;
		const value = this.filterForm.value;
		this.store.getEvents$({
			size,
			page,
			q: value.q || undefined,
			action: value.action || undefined,
			entityType: value.entityType || undefined,
			createdFrom: this.toDateParam(value.createdFrom),
			createdTo: this.toDateParam(value.createdTo),
		});
	}

	private toDateParam(date: Date | null | undefined): string | undefined {
		if (!date) return undefined;
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}
}
