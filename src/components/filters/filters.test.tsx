import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FormField } from "@/components/form/FormField";
import { FilterBar } from "./FilterBar";
import { FilterSelect } from "./FilterSelect";
import { SEARCHING_MESSAGE, SearchInput } from "./SearchInput";

describe("SearchInput", () => {
	it("recebe rótulo e dica pelo FormField", () => {
		render(
			<FormField label="Buscar" hint="Nome ou especialidade">
				<SearchInput />
			</FormField>,
		);

		const input = screen.getByRole("searchbox", { name: "Buscar" });
		expect(input).toHaveAccessibleDescription("Nome ou especialidade");
		expect(input).toHaveAttribute("autocomplete", "off");
	});

	it("anuncia Buscando… só enquanto ocupado", () => {
		const { rerender } = render(<SearchInput aria-label="Buscar" />);
		expect(screen.getByRole("status")).toBeEmptyDOMElement();

		rerender(<SearchInput aria-label="Buscar" isBusy />);
		expect(screen.getByRole("status")).toHaveTextContent(SEARCHING_MESSAGE);
	});
});

function SelectHarness({ onChange }: { onChange: (value: string) => void }) {
	const [value, setValue] = useState("");
	return (
		<FormField label="Ação">
			<FilterSelect
				value={value}
				onChange={(next) => {
					setValue(next);
					onChange(next);
				}}
				options={[
					{ value: "create", label: "Criação" },
					{ value: "delete", label: "Exclusão" },
				]}
				allOptionLabel="Todas"
			/>
		</FormField>
	);
}

describe("FilterSelect", () => {
	it("mostra Todas para o valor vazio e devolve vazio ao escolher Todas", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<SelectHarness onChange={onChange} />);
		const trigger = screen.getByRole("combobox", { name: "Ação" });
		expect(trigger).toHaveTextContent("Todas");

		await user.click(trigger);
		await user.click(await screen.findByRole("option", { name: "Exclusão" }));
		expect(onChange).toHaveBeenLastCalledWith("delete");
		expect(trigger).toHaveTextContent("Exclusão");

		await user.click(trigger);
		await user.click(await screen.findByRole("option", { name: "Todas" }));
		expect(onChange).toHaveBeenLastCalledWith("");
	});

	it("não oferece Todas quando não há rótulo para ela", async () => {
		const user = userEvent.setup();
		render(
			<FilterSelect
				aria-label="Ordenar por"
				value="recentes"
				onChange={() => {}}
				options={[
					{ value: "recentes", label: "Mais recentes" },
					{ value: "nome", label: "Nome A–Z" },
				]}
			/>,
		);

		await user.click(screen.getByRole("combobox", { name: "Ordenar por" }));
		expect(await screen.findAllByRole("option")).toHaveLength(2);
		expect(screen.queryByRole("option", { name: "Todas" })).not.toBeInTheDocument();
	});

	// Regressão: alinhada ao item selecionado, a lista de meses abria cortada perto do topo da tela.
	it("abre a lista ancorada abaixo do campo, e não alinhada ao item selecionado", async () => {
		const user = userEvent.setup();
		render(
			<FilterSelect
				aria-label="Mês"
				value="8"
				onChange={() => {}}
				options={Array.from({ length: 12 }, (_, index) => ({
					value: String(index),
					label: `Mês ${index + 1}`,
				}))}
			/>,
		);

		await user.click(screen.getByRole("combobox", { name: "Mês" }));

		const listbox = await screen.findByRole("listbox");
		expect(listbox.closest("[data-radix-popper-content-wrapper]")).not.toBeNull();
		expect(screen.getAllByRole("option")).toHaveLength(12);
	});
});

describe("FilterBar", () => {
	it("agrupa busca e filtros numa região de busca nomeada", () => {
		render(
			<FilterBar
				label="Filtros das salas"
				search={<input aria-label="Buscar" />}
				onClear={() => {}}
				canClear={false}
			>
				<select aria-label="Status" />
			</FilterBar>,
		);

		// O jsdom ainda não dá ao <search> o papel "search", que os navegadores já dão.
		const region = screen.getByLabelText("Filtros das salas");
		expect(region.tagName).toBe("SEARCH");
		expect(region).toContainElement(screen.getByLabelText("Buscar"));
		expect(region).toContainElement(screen.getByLabelText("Status"));
	});

	it("desabilita Limpar filtros quando nada está ativo", () => {
		render(<FilterBar label="Filtros" search={null} onClear={() => {}} canClear={false} />);

		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();
	});

	it("limpa ao clicar quando há filtros", async () => {
		const user = userEvent.setup();
		const onClear = vi.fn();
		render(<FilterBar label="Filtros" search={null} onClear={onClear} canClear />);

		await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
		expect(onClear).toHaveBeenCalledOnce();
	});
});
