import { act, renderHook } from "@testing-library/react";
import { useFilteredPage } from "./use-filtered-page";

describe("useFilteredPage", () => {
	it("começa na primeira página e troca de página", () => {
		const { result } = renderHook(() => useFilteredPage({ busca: "" }));
		expect(result.current[0]).toBe(0);

		act(() => result.current[1](2));
		expect(result.current[0]).toBe(2);
	});

	it("volta para a primeira página quando os filtros mudam", () => {
		const { result, rerender } = renderHook(({ filters }) => useFilteredPage(filters), {
			initialProps: { filters: { busca: "" } },
		});
		act(() => result.current[1](3));

		rerender({ filters: { busca: "ana" } });
		expect(result.current[0]).toBe(0);
	});

	it("mantém a página quando os filtros são iguais, mesmo em outro objeto", () => {
		const { result, rerender } = renderHook(({ filters }) => useFilteredPage(filters), {
			initialProps: { filters: { busca: "ana" } },
		});
		act(() => result.current[1](1));

		rerender({ filters: { busca: "ana" } });
		expect(result.current[0]).toBe(1);
	});
});
