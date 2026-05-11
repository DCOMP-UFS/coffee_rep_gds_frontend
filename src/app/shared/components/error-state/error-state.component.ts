import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
	selector: "app-error-state",
	standalone: true,
	imports: [MatIconModule, MatButtonModule],
	templateUrl: "./error-state.component.html",
	styleUrl: "./error-state.component.scss",
})
export class ErrorStateComponent {
	@Input() message = "Não foi possível carregar os dados.";
	@Output() retry = new EventEmitter<void>();

	onRetry(): void {
		this.retry.emit();
	}
}
