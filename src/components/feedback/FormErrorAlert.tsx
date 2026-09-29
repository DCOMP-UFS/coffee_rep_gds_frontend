import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface FormErrorAlertProps {
	message: string;
	/** Ação opcional ao lado da mensagem, como "Tentar novamente". */
	action?: ReactNode;
	className?: string;
}

/** Erro de uma ação que o usuário está aguardando, mostrado onde ele está olhando. */
export function FormErrorAlert({ message, action, className }: FormErrorAlertProps) {
	return (
		<Alert variant="destructive" className={cn("animate-in fade-in", className)}>
			<CircleAlert aria-hidden="true" />
			<AlertDescription>
				<p>{message}</p>
				{action}
			</AlertDescription>
		</Alert>
	);
}
