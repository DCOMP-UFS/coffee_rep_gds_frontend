import { CloudOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
	title?: string;
	description?: string;
	onRetry?: () => void;
	retryLabel?: string;
	isRetrying?: boolean;
	className?: string;
}

export function ErrorState({
	title = "Não foi possível carregar os dados.",
	description = "Verifique sua conexão e tente novamente.",
	onRetry,
	retryLabel = "Tentar novamente",
	isRetrying = false,
	className,
}: ErrorStateProps) {
	return (
		<div
			role="alert"
			className={cn(
				"flex flex-col items-center gap-3 px-6 py-12 text-center animate-in fade-in",
				className,
			)}
		>
			<div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
				<CloudOff className="size-7" aria-hidden="true" />
			</div>
			<h2 className="text-lg font-semibold text-foreground">{title}</h2>
			<p className="max-w-sm text-sm text-muted-foreground">{description}</p>
			{onRetry && (
				<Button variant="outline" onClick={onRetry} disabled={isRetrying} className="mt-2">
					<RotateCw className={cn(isRetrying && "animate-spin")} aria-hidden="true" />
					{retryLabel}
				</Button>
			)}
		</div>
	);
}
