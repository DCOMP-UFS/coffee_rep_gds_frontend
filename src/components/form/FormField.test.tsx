import { render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/input";
import { FormField } from "./FormField";

describe("FormField", () => {
	it("mostra (obrigatório) no rótulo e marca o controle como obrigatório", () => {
		render(
			<FormField label="Nome" required>
				<Input />
			</FormField>,
		);

		const input = screen.getByLabelText("Nome (obrigatório)");
		expect(input).toHaveAttribute("aria-required", "true");
	});

	it("não marca campos opcionais", () => {
		render(
			<FormField label="Observação">
				<Input />
			</FormField>,
		);

		const input = screen.getByLabelText("Observação");
		expect(input).not.toHaveAttribute("aria-required");
		expect(screen.queryByText("(obrigatório)")).not.toBeInTheDocument();
	});

	it("liga a mensagem de erro ao controle", () => {
		render(
			<FormField label="Nome" required error="Informe o nome.">
				<Input />
			</FormField>,
		);

		const input = screen.getByLabelText("Nome (obrigatório)");
		expect(input).toHaveAttribute("aria-invalid", "true");
		expect(input).toHaveAccessibleDescription("Informe o nome.");
	});
});
