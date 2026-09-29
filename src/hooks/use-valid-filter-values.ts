import { useState } from "react";
import { type Control, type FieldValues, useWatch } from "react-hook-form";
import type { z } from "zod";

/**
 * Últimos valores válidos de um formulário de filtros, para aplicá-los na hora, sem botão de
 * enviar. Enquanto um campo está inválido (uma data incompleta, por exemplo), a lista continua
 * com o último filtro válido. Os valores padrão do formulário precisam ser válidos.
 */
export function useValidFilterValues<TInput extends FieldValues, TOutput>(
	control: Control<TInput, unknown, TOutput>,
	schema: z.ZodType<TOutput, TInput>,
): TOutput {
	const values = useWatch({ control });
	const result = schema.safeParse(values);
	const [valid, setValid] = useState(() => {
		const data = schema.parse(values);
		return { key: JSON.stringify(data), data };
	});

	// Atualizado durante a renderização, para nenhuma consulta sair com os valores antigos; a
	// chave mantém a mesma referência enquanto os valores não mudam.
	if (result.success) {
		const key = JSON.stringify(result.data);
		if (key !== valid.key) setValid({ key, data: result.data });
	}

	return valid.data;
}
