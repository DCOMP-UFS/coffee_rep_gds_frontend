import { Loader2, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FormErrorAlert } from "./FormErrorAlert";

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: ReactNode;
	description?: ReactNode;
	confirmLabel?: string;
	/** Texto do botão que fecha sem confirmar; troque quando "Cancelar" for ambíguo. */
	cancelLabel?: string;
	/** Mantém o diálogo aberto e bloqueia os botões enquanto a ação roda. */
	isPending?: boolean;
	/** Motivo da última falha, mostrado dentro do diálogo. */
	error?: string;
	/** Impede a confirmação, ex.: enquanto uma pré-condição é verificada ou não é atendida. */
	confirmDisabled?: boolean;
	onConfirm: () => void;
	/** Conteúdo extra entre o cabeçalho e os botões. */
	children?: ReactNode;
}

/**
 * Confirmação de ação destrutiva. Quem abre decide quando fechar (normalmente no sucesso da
 * mutação), para o usuário ver o andamento e poder tentar de novo em caso de erro.
 */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description = "Essa ação será irreversível.",
	confirmLabel = "Excluir",
	cancelLabel = "Cancelar",
	isPending = false,
	error,
	confirmDisabled = false,
	onConfirm,
	children,
}: ConfirmDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia className="bg-destructive/10 text-destructive">
						<TriangleAlert />
					</AlertDialogMedia>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				{children}
				{error && <FormErrorAlert message={error} />}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
					<Button variant="destructive" disabled={isPending || confirmDisabled} onClick={onConfirm}>
						{isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
						{confirmLabel}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
