import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
	selector: "app-empty-state",
	standalone: true,
	imports: [MatIconModule, MatButtonModule],
	templateUrl: "./empty-state.component.html",
	styleUrl: "./empty-state.component.scss",
})
export class EmptyStateComponent {
	@Input() icon = "inbox";
	@Input() title = "";
	@Input() description = "";
	@Input() actionLabel?: string;
	@Output() action = new EventEmitter<void>();

	onAction(): void {
		this.action.emit();
	}
}
