import { act, renderHook } from "@testing-library/react";
import { SEARCH_DEBOUNCE_MS, useDebouncedSearch, useDebouncedValue } from "./use-debounced-value";

describe("useDebouncedValue", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("só entrega o valor novo depois de 300 ms sem mudanças", () => {
		const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
			initialProps: { value: "a" },
		});

		rerender({ value: "ab" });
		act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
		expect(result.current).toBe("a");

		act(() => vi.advanceTimersByTime(1));
		expect(result.current).toBe("ab");
	});

	it("reinicia a espera a cada mudança", () => {
		const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
			initialProps: { value: "a" },
		});

		rerender({ value: "ab" });
		act(() => vi.advanceTimersByTime(200));
		rerender({ value: "abc" });
		act(() => vi.advanceTimersByTime(200));
		expect(result.current).toBe("a");

		act(() => vi.advanceTimersByTime(100));
		expect(result.current).toBe("abc");
	});

	it("aplica na hora os valores indicados em flush", () => {
		const { result, rerender } = renderHook(
			({ value }) => useDebouncedValue(value, { flush: (next) => next === "" }),
			{ initialProps: { value: "ana" } },
		);

		rerender({ value: "" });
		expect(result.current).toBe("");
	});
});

describe("useDebouncedSearch", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("indica a espera até aplicar o termo sem espaços nas pontas", () => {
		const { result, rerender } = renderHook(({ input }) => useDebouncedSearch(input), {
			initialProps: { input: "" },
		});

		rerender({ input: "  ana " });
		expect(result.current).toEqual({ applied: "", isPending: true });

		act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
		expect(result.current).toEqual({ applied: "ana", isPending: false });
	});

	it("não espera quando só mudam os espaços nas pontas", () => {
		const { result, rerender } = renderHook(({ input }) => useDebouncedSearch(input), {
			initialProps: { input: "ana" },
		});

		rerender({ input: "ana  " });
		expect(result.current.isPending).toBe(false);
	});

	it("limpa na hora quando a busca é apagada", () => {
		const { result, rerender } = renderHook(({ input }) => useDebouncedSearch(input), {
			initialProps: { input: "ana" },
		});

		rerender({ input: "   " });
		expect(result.current).toEqual({ applied: "", isPending: false });
	});
});
