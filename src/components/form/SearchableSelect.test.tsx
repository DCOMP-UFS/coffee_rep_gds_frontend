import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect } from "./SearchableSelect";

const OPTIONS = [
	{ value: 0, label: "Todas" },
	{ value: 12, label: "Clínica Médica" },
	{ value: 21, label: "Pediatria" },
];

function Harness({ onChange }: { onChange: (value: number) => void }) {
	const [value, setValue] = useState(0);
	return (
		<SearchableSelect
			aria-label="Setor"
			options={OPTIONS}
			value={value}
			onChange={(next) => {
				setValue(next);
				onChange(next);
			}}
		/>
	);
}

describe("SearchableSelect", () => {
	it("filtra pelo rótulo, ignorando acentos, e seleciona a opção", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Harness onChange={onChange} />);

		await user.click(screen.getByRole("combobox", { name: "Setor" }));
		await user.type(screen.getByPlaceholderText("Pesquisar..."), "clinica medica");

		expect(screen.queryByRole("option", { name: "Pediatria" })).not.toBeInTheDocument();
		await user.click(screen.getByRole("option", { name: "Clínica Médica" }));

		expect(onChange).toHaveBeenCalledWith(12);
		expect(screen.getByRole("combobox", { name: "Setor" })).toHaveTextContent("Clínica Médica");
	});

	it("lista o placeholder como primeira opção desabilitada e o esconde na busca", async () => {
		const user = userEvent.setup();
		render(<Harness onChange={vi.fn()} />);

		await user.click(screen.getByRole("combobox", { name: "Setor" }));
		const [first] = screen.getAllByRole("option");
		expect(first).toHaveTextContent("Selecione");
		expect(first).toHaveAttribute("aria-disabled", "true");

		await user.type(screen.getByPlaceholderText("Pesquisar..."), "ped");
		expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
			"Pediatria",
		]);
	});

	it("não encontra opções pelo id", async () => {
		const user = userEvent.setup();
		render(<Harness onChange={vi.fn()} />);

		await user.click(screen.getByRole("combobox", { name: "Setor" }));
		await user.type(screen.getByPlaceholderText("Pesquisar..."), "21");

		expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument();
	});

	it("rola a lista com a roda do mouse dentro de um diálogo", async () => {
		const user = userEvent.setup();
		render(
			<Dialog open>
				<DialogContent aria-describedby={undefined}>
					<DialogTitle>Nova ausência</DialogTitle>
					<Harness onChange={vi.fn()} />
				</DialogContent>
			</Dialog>,
		);

		await user.click(screen.getByRole("combobox", { name: "Setor" }));
		const list = screen.getByRole("listbox");
		// jsdom não calcula layout: a lista precisa parecer rolável para a trava de rolagem avaliar.
		list.style.overflowY = "auto";
		Object.defineProperty(list, "scrollHeight", { configurable: true, value: 500 });
		Object.defineProperty(list, "clientHeight", { configurable: true, value: 100 });

		const notCancelled = fireEvent.wheel(screen.getByRole("option", { name: "Pediatria" }), {
			deltaY: 100,
		});

		expect(notCancelled).toBe(true);
	});
});
