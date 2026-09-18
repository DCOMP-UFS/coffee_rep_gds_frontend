import {
	Component,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { PaginationPageChange } from "./pagination-page-change.model";
import {
	clampPage,
	getVisiblePages,
	pageFromIndex,
	PageItem,
} from "./pagination-range";
import { PaginationSummaryComponent } from "./pagination-summary.component";

@Component({
	selector: "app-pagination-bar",
	standalone: true,
	imports: [FormsModule, PaginationSummaryComponent],
	templateUrl: "./pagination-bar.component.html",
	styleUrl: "./pagination-bar.component.scss",
})
export class PaginationBarComponent implements OnChanges {
	@Input() pageIndex = 0;
	@Input() pageSize = 5;
	@Input() totalElements = 0;
	@Input() summaryLabel = "registro(s)";
	@Input() pageSizeOptions: number[] = [5, 10];
	@Input() disabled = false;

	@Output() pageChange = new EventEmitter<PaginationPageChange>();

	readonly gotoInputId = `pagination-goto-${crypto.randomUUID()}`;
	gotoValue = "1";

	get totalPages(): number {
		return pageFromIndex(this.pageIndex, this.pageSize, this.totalElements)
			.totalPages;
	}

	get page(): number {
		return pageFromIndex(this.pageIndex, this.pageSize, this.totalElements)
			.page;
	}

	get visiblePages(): PageItem[] {
		return getVisiblePages(this.page, this.totalPages);
	}

	get controlsDisabled(): boolean {
		return this.disabled || this.totalPages <= 1;
	}

	get atFirst(): boolean {
		return this.page <= 1;
	}

	get atLast(): boolean {
		return this.page >= this.totalPages;
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes["pageIndex"] || changes["pageSize"] || changes["totalElements"]) {
			this.gotoValue = String(this.page);
		}
	}

	goTo(nextPage1Based: number): void {
		const clamped = clampPage(nextPage1Based, this.totalPages);
		const nextIndex = clamped - 1;
		if (nextIndex === this.pageIndex) return;
		this.pageChange.emit({ pageIndex: nextIndex, pageSize: this.pageSize });
	}

	onPageSizeChange(raw: number | string): void {
		const nextSize = Number(raw);
		if (!Number.isFinite(nextSize) || nextSize <= 0) return;
		if (nextSize === this.pageSize) return;
		this.pageChange.emit({ pageIndex: 0, pageSize: nextSize });
	}

	onGotoSubmit(event: Event): void {
		event.preventDefault();
		const parsed = Number(this.gotoValue);
		if (!Number.isFinite(parsed)) {
			this.gotoValue = String(this.page);
			return;
		}
		this.goTo(parsed);
	}

	isEllipsis(item: PageItem): item is "ellipsis" {
		return item === "ellipsis";
	}
}
