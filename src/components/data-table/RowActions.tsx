import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { RowActionButton } from "./RowActionButton";

interface RowActionsProps {
	/** Nome acessível do botão de editar, ex.: "Editar sala Sala 01". */
	editLabel: string;
	/** Nome acessível do botão de excluir, ex.: "Excluir sala Sala 01". */
	deleteLabel: string;
	onEdit: () => void;
	onDelete: () => void;
}

/** Botões Editar e Excluir da última coluna das tabelas de cadastro. */
export function RowActions({ editLabel, deleteLabel, onEdit, onDelete }: RowActionsProps) {
	return (
		<div className="flex justify-end gap-1">
			<RowActionButton icon={Pencil} label={editLabel} tooltip="Editar" onClick={onEdit} />
			<RowActionButton
				icon={Trash2}
				label={deleteLabel}
				tooltip="Excluir"
				destructive
				onClick={onDelete}
			/>
		</div>
	);
}

/**
 * Coluna "Ações" das tabelas de cadastro. Devolve uma lista para ser espalhada no fim das
 * colunas: vazia quando o perfil não pode alterar os registros, o que some com a coluna inteira.
 */
export function actionsColumn<TData>(
	enabled: boolean,
	renderActions: (row: TData) => ReactNode,
	className = "w-28 text-right",
): ColumnDef<TData>[] {
	if (!enabled) return [];
	return [
		{
			id: "actions",
			header: () => <span className="sr-only md:not-sr-only">Ações</span>,
			meta: { className },
			cell: ({ row }) => renderActions(row.original),
		},
	];
}
