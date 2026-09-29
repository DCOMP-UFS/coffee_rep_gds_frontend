import { Pencil, Trash2 } from "lucide-react";
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
