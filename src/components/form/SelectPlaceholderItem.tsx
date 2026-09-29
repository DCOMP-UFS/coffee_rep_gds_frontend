import { SelectItem } from "@/components/ui/select";

/** O Radix Select não aceita item com valor vazio, então o placeholder usa um valor reservado. */
export const SELECT_PLACEHOLDER_VALUE = "__placeholder__";

/** Primeira opção desabilitada do select, equivalente ao `<option value="" disabled>`. */
export function SelectPlaceholderItem({ children }: { children: string }) {
	return (
		<SelectItem value={SELECT_PLACEHOLDER_VALUE} disabled>
			{children}
		</SelectItem>
	);
}
