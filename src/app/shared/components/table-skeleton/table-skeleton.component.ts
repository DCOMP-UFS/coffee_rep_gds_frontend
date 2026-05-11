import { Component, Input } from "@angular/core";

@Component({
	selector: "app-table-skeleton",
	standalone: true,
	templateUrl: "./table-skeleton.component.html",
	styleUrl: "./table-skeleton.component.scss",
})
export class TableSkeletonComponent {
	@Input() rows = 5;
	@Input() columns = 5;

	get rowIndexes(): number[] {
		return Array.from({ length: this.rows }, (_, i) => i);
	}

	get colIndexes(): number[] {
		return Array.from({ length: this.columns }, (_, i) => i);
	}
}
