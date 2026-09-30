import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { ActionLock } from "@/components/actions/action-lock";
import { RowActionButton } from "./RowActionButton";

interface RowActionsProps {
	/** Nome acessível do botão de editar, ex.: "Editar sala Sala 01". */
	editLabel: string;
	/** Nome acessível do botão de excluir, ex.: "Excluir sala Sala 01". */
	deleteLabel: string;
	/** Presente quando o perfil não pode alterar o registro. */
	lock?: ActionLock;
	onEdit: () => void;
	onDelete: () => void;
}

/** Botões Editar e Excluir da última coluna das tabelas de cadastro. */
export function RowActions({ editLabel, deleteLabel, lock, onEdit, onDelete }: RowActionsProps) {
	return (
		<div className="flex justify-end gap-1">
			<RowActionButton
				icon={Pencil}
				label={editLabel}
				tooltip="Editar"
				lock={lock}
				onClick={onEdit}
			/>
			<RowActionButton
				icon={Trash2}
				label={deleteLabel}
				tooltip="Excluir"
				destructive
				lock={lock}
				onClick={onDelete}
			/>
		</div>
	);
}

/**
 * Coluna "Ações" das tabelas de cadastro, para ser espalhada no fim das colunas. Aparece para
 * todos os perfis: quem não pode alterar os registros vê as ações bloqueadas.
 */
export function actionsColumn<TData>(
	renderActions: (row: TData) => ReactNode,
	className = "w-28 text-right",
): ColumnDef<TData>[] {
	return [
		{
			id: "actions",
			header: () => <span className="sr-only md:not-sr-only">Ações</span>,
			meta: { className },
			cell: ({ row }) => renderActions(row.original),
		},
	];
}
