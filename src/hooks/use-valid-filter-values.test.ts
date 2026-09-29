import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useValidFilterValues } from "./use-valid-filter-values";

const schema = z.object({
	termo: z.string().trim(),
	ano: z.string().regex(/^\d{4}$/),
});

type Input = z.input<typeof schema>;

function useFilterForm() {
	const form = useForm<Input, unknown, z.output<typeof schema>>({
		defaultValues: { termo: "", ano: "2026" },
	});
	const valid = useValidFilterValues(form.control, schema);
	return { form, valid };
}

describe("useValidFilterValues", () => {
	it("começa com os valores padrão já validados", () => {
		const { result } = renderHook(useFilterForm);

		expect(result.current.valid).toEqual({ termo: "", ano: "2026" });
	});

	it("acompanha as mudanças válidas, já transformadas pelo schema", () => {
		const { result } = renderHook(useFilterForm);

		act(() => result.current.form.setValue("termo", "  ana "));
		expect(result.current.valid).toEqual({ termo: "ana", ano: "2026" });
	});

	it("mantém o último valor válido enquanto o formulário está inválido", () => {
		const { result } = renderHook(useFilterForm);
		act(() => result.current.form.setValue("ano", "2025"));

		act(() => result.current.form.setValue("ano", "20"));
		expect(result.current.valid).toEqual({ termo: "", ano: "2025" });

		act(() => result.current.form.setValue("ano", "2027"));
		expect(result.current.valid).toEqual({ termo: "", ano: "2027" });
	});

	it("volta aos padrões quando o formulário é reiniciado", () => {
		const { result } = renderHook(useFilterForm);
		act(() => result.current.form.setValue("ano", "2025"));

		act(() => result.current.form.reset());
		expect(result.current.valid).toEqual({ termo: "", ano: "2026" });
	});
});
