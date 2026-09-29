import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormErrorAlert } from "./FormErrorAlert";

interface LoadErrorAlertProps {
	message: string;
	onRetry: () => void;
	isRetrying: boolean;
	className?: string;
}

/** Falha ao carregar uma parte da tela, com a opção de tentar de novo sem sair dela. */
export function LoadErrorAlert({ message, onRetry, isRetrying, className }: LoadErrorAlertProps) {
	return (
		<FormErrorAlert
			message={message}
			className={className}
			action={
				<Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
					{isRetrying && <Loader2 className="animate-spin" aria-hidden="true" />}
					Tentar novamente
				</Button>
			}
		/>
	);
}
