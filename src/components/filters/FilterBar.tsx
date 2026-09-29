import type { ReactNode } from "react";
import { ClearFiltersButton } from "./ClearFiltersButton";

interface FilterBarProps {
	/** Nome da região de busca para leitores de tela, ex.: "Filtros das salas". */
	label: string;
	/** Busca livre, sozinha na primeira linha. */
	search: ReactNode;
	/** Filtros e ordenação, na segunda linha. */
	children?: ReactNode;
	onClear: () => void;
	/** Há algo diferente do padrão; sem isso o botão fica desabilitado. */
	canClear: boolean;
}

/** Área de filtros comum às tabelas: busca numa linha e, abaixo, filtros e "Limpar filtros". */
export function FilterBar({ label, search, children, onClear, canClear }: FilterBarProps) {
	return (
		<search aria-label={label} className="grid gap-3 border-b p-4">
			{search}
			<div className="flex flex-wrap items-start gap-3">
				{children}
				<ClearFiltersButton onClick={onClear} disabled={!canClear} className="ml-auto sm:mt-5.5" />
			</div>
		</search>
	);
}
