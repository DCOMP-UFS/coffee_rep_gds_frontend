import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaginationBar } from "./PaginationBar";

const PAGE = { number: 1, size: 5, totalElements: 23, totalPages: 5 };

function renderBar(page = PAGE) {
	const onPageChange = vi.fn();
	const onPageSizeChange = vi.fn();
	render(
		<PaginationBar
			page={page}
			pageSizeOptions={[5, 10]}
			onPageChange={onPageChange}
			onPageSizeChange={onPageSizeChange}
		/>,
	);
	return { onPageChange, onPageSizeChange };
}

describe("PaginationBar", () => {
	it("mostra o intervalo exibido a partir dos metadados base 0", () => {
		renderBar();
		expect(screen.getByText(/Mostrando/)).toHaveTextContent("Mostrando 6–10 de 23");
		expect(screen.getByRole("button", { name: "Página 2" })).toHaveAttribute(
			"aria-current",
			"page",
		);
	});

	it("navega entre páginas", async () => {
		const user = userEvent.setup();
		const { onPageChange } = renderBar();

		await user.click(screen.getByRole("button", { name: "Próxima página" }));
		await user.click(screen.getByRole("button", { name: "Última página" }));
		await user.click(screen.getByRole("button", { name: "Página 1" }));

		expect(onPageChange.mock.calls).toEqual([[2], [4], [0]]);
	});

	it("desabilita voltar na primeira página", () => {
		renderBar({ ...PAGE, number: 0 });
		expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Primeira página" })).toBeDisabled();
	});

	it("troca a quantidade de itens por página", async () => {
		const user = userEvent.setup();
		const { onPageSizeChange } = renderBar();

		await user.click(screen.getByRole("combobox", { name: "Itens por página" }));
		await user.click(screen.getByRole("option", { name: "10" }));

		expect(onPageSizeChange).toHaveBeenCalledWith(10);
	});

	it("oferece uma primeira opção desabilitada no select de itens por página", async () => {
		const user = userEvent.setup();
		renderBar();

		await user.click(screen.getByRole("combobox", { name: "Itens por página" }));
		const [first] = screen.getAllByRole("option");
		expect(first).toHaveTextContent("Itens por página");
		expect(first).toHaveAttribute("aria-disabled", "true");
	});

	it("mostra 0–0 sem registros e esconde a navegação", () => {
		renderBar({ number: 0, size: 5, totalElements: 0, totalPages: 0 });
		expect(screen.getByText(/Mostrando/)).toHaveTextContent("Mostrando 0–0 de 0");
		expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
	});
});
