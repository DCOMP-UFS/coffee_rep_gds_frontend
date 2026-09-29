import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

interface MaskedInputProps extends ComponentProps<typeof Input> {
	/** Recebe o texto digitado e devolve a versão formatada (ver `shared/format/masks`). */
	mask: (value: string) => string;
}

/**
 * Campo com máscara aplicada na digitação, no lugar do `ngx-mask`. Formata o valor do
 * próprio evento antes de repassá-lo, então funciona com `register` do React Hook Form.
 */
export function MaskedInput({ mask, onChange, inputMode = "numeric", ...props }: MaskedInputProps) {
	return (
		<Input
			{...props}
			inputMode={inputMode}
			onChange={(event) => {
				event.target.value = mask(event.target.value);
				onChange?.(event);
			}}
		/>
	);
}
