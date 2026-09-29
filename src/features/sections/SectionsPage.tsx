import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { RowActions } from "@/components/data-table/RowActions";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteSectionDialog } from "./DeleteSectionDialog";
import { useSections } from "./hooks";
import { SectionFormDialog } from "./SectionFormDialog";
import type { Section } from "./types";

export function SectionsPage() {
	const sections = useSections();

	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Section>();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleting, setDeleting] = useState<Section>();

	const openForm = useCallback((section?: Section) => {
		setEditing(section);
		setFormOpen(true);
	}, []);

	const askDelete = useCallback((section: Section) => {
		setDeleting(section);
		setConfirmOpen(true);
	}, []);

	const columns = useMemo<ColumnDef<Section>[]>(
		() => [
			{
				accessorKey: "nome",
				header: "Nome",
				cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
			},
			{
				id: "observacoes",
				header: "Observação",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.observacoes || "—"}</span>
				),
			},
			{
				id: "actions",
				header: () => <span className="sr-only md:not-sr-only">Ações</span>,
				meta: { className: "w-28 text-right" },
				cell: ({ row }) => (
					<RowActions
						editLabel={`Editar setor ${row.original.nome}`}
						deleteLabel={`Excluir setor ${row.original.nome}`}
						onEdit={() => openForm(row.original)}
						onDelete={() => askDelete(row.original)}
					/>
				),
			},
		],
		[openForm, askDelete],
	);

	const data = sections.data ?? [];
	const total = data.length === 1 ? "1 setor" : `${data.length} setores`;
	const newSectionButton = (
		<Button onClick={() => openForm()}>
			<Plus aria-hidden="true" />
			Novo setor
		</Button>
	);

	return (
		<>
			<PageHeader
				icon={Building2}
				title="Setores"
				description="Organize os setores usados no cadastro de salas e nos filtros."
				actions={newSectionButton}
			/>

			<Card className="gap-0 overflow-hidden py-0">
				<DataTable
					caption="Setores cadastrados"
					columns={columns}
					data={data}
					getRowId={(section) => String(section.id)}
					isLoading={sections.isPending}
					isError={sections.isError}
					onRetry={() => sections.refetch()}
					isRetrying={sections.isFetching}
					emptyState={
						<EmptyState
							title="Nenhum setor cadastrado"
							description="Os setores são usados ao cadastrar salas e filtros."
							action={newSectionButton}
						/>
					}
					header={data.length > 0 && <p>{total}</p>}
					footer={
						data.length > 0 && (
							<p className="border-t px-4 py-3 text-sm text-muted-foreground">{total}</p>
						)
					}
				/>
			</Card>

			<SectionFormDialog open={formOpen} onOpenChange={setFormOpen} section={editing} />

			<DeleteSectionDialog open={confirmOpen} onOpenChange={setConfirmOpen} section={deleting} />
		</>
	);
}
