import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { lazy, Suspense } from "react";
import { reloadPage } from "@/lib/reload-page";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

vi.mock("@/lib/reload-page", () => ({ reloadPage: vi.fn() }));

/** Simula o arquivo de uma tela que não existe mais depois de um novo deploy. */
const MissingChunkPage = lazy(() =>
	Promise.reject(new TypeError("Failed to fetch dynamically imported module")),
);

function renderWithBoundary(routeKey: string) {
	return render(
		<RouteErrorBoundary key={routeKey}>
			<Suspense fallback={<p>Carregando…</p>}>
				<MissingChunkPage />
			</Suspense>
		</RouteErrorBoundary>,
	);
}

describe("RouteErrorBoundary", () => {
	beforeEach(() => {
		// O React registra no console os erros capturados pela boundary.
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("mostra o conteúdo quando nada falha", () => {
		render(
			<RouteErrorBoundary>
				<p>Tela de salas</p>
			</RouteErrorBoundary>,
		);
		expect(screen.getByText("Tela de salas")).toBeInTheDocument();
	});

	it("troca a tela em branco por um aviso quando o arquivo da tela não carrega", async () => {
		const user = userEvent.setup();
		renderWithBoundary("/rooms");

		const alert = await screen.findByRole("alert");
		expect(alert).toHaveTextContent("Não foi possível abrir esta tela.");

		await user.click(screen.getByRole("button", { name: "Recarregar página" }));
		expect(reloadPage).toHaveBeenCalledOnce();
	});

	it("limpa o erro ao trocar de rota", async () => {
		const { rerender } = renderWithBoundary("/rooms");
		await screen.findByRole("alert");

		rerender(
			<RouteErrorBoundary key="/sections">
				<p>Tela de setores</p>
			</RouteErrorBoundary>,
		);

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(screen.getByText("Tela de setores")).toBeInTheDocument();
	});
});
