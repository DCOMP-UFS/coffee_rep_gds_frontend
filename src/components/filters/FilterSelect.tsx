import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export interface FilterOption<TValue extends string = string> {
	value: TValue;
	label: string;
}

/** O Radix Select não aceita item com valor vazio; fora daqui, a opção "Todas" continua sendo `""`. */
const ALL_OPTIONS_VALUE = "__todas__";

interface FilterSelectProps<TValue extends string> {
	id?: string;
	"aria-describedby"?: string;
	/** Nome acessível quando o select não tem um rótulo visível associado. */
	"aria-label"?: string;
	value: TValue;
	onChange: (value: TValue) => void;
	options: readonly FilterOption<TValue>[];
	/** Rótulo da opção que desliga o filtro, com valor `""`; ex.: "Todas". */
	allOptionLabel?: string;
}

/** Select de filtro ou de ordenação, que aplica a escolha na hora. */
export function FilterSelect<TValue extends string>({
	value,
	onChange,
	options,
	allOptionLabel,
	...triggerProps
}: FilterSelectProps<TValue>) {
	return (
		<Select
			value={value || ALL_OPTIONS_VALUE}
			onValueChange={(next) => onChange((next === ALL_OPTIONS_VALUE ? "" : next) as TValue)}
		>
			<SelectTrigger className="w-full" {...triggerProps}>
				<SelectValue />
			</SelectTrigger>
			{/* No modo padrão ("item-aligned"), o item selecionado fica sobre o campo e, perto do topo da
			tela, os itens anteriores eram cortados; "popper" abre a lista inteira abaixo do campo. */}
			<SelectContent position="popper">
				{allOptionLabel !== undefined && (
					<SelectItem value={ALL_OPTIONS_VALUE}>{allOptionLabel}</SelectItem>
				)}
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
