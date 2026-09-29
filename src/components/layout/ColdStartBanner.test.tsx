import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { COLD_START_DELAY_MS, ColdStartBanner } from "./ColdStartBanner";

function PendingQuery({ promise }: { promise: Promise<string> }) {
	useQuery({ queryKey: ["slow"], queryFn: () => promise });
	return null;
}

describe("ColdStartBanner", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it("aparece só depois do limiar e some quando a requisição termina", async () => {
		let resolve: (value: string) => void = () => {};
		const promise = new Promise<string>((done) => {
			resolve = done;
		});

		render(
			<QueryClientProvider client={new QueryClient()}>
				<PendingQuery promise={promise} />
				<ColdStartBanner />
			</QueryClientProvider>,
		);

		await act(() => vi.advanceTimersByTimeAsync(COLD_START_DELAY_MS - 100));
		expect(screen.queryByRole("status")).not.toBeInTheDocument();

		await act(() => vi.advanceTimersByTimeAsync(200));
		expect(screen.getByRole("status")).toHaveTextContent("O servidor pode estar iniciando");

		await act(async () => {
			resolve("ok");
			// O TanStack Query entrega notificações num setTimeout(0), retido pelos timers falsos.
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});
});
