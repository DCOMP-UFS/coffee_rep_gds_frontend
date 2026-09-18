import { Component, Input } from "@angular/core";
import {
	formatPaginationSummary,
	pageFromIndex,
} from "./pagination-range";

@Component({
	selector: "app-pagination-summary",
	standalone: true,
	template: `<p class="pagination-summary">{{ text }}</p>`,
	styles: [
		`
			.pagination-summary {
				margin: 0;
				padding: 0.5rem 0;
				font-size: 0.9rem;
				font-weight: 500;
				line-height: 1.4;
				color: #64748b;
				white-space: nowrap;
			}
		`,
	],
})
export class PaginationSummaryComponent {
	@Input() pageIndex = 0;
	@Input() pageSize = 5;
	@Input() totalElements = 0;
	@Input() summaryLabel = "registro(s)";

	get text(): string {
		const { page, totalPages } = pageFromIndex(
			this.pageIndex,
			this.pageSize,
			this.totalElements,
		);
		return formatPaginationSummary(
			this.totalElements,
			this.summaryLabel,
			page,
			totalPages,
		);
	}
}
