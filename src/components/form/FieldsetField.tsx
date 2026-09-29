import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import { REQUIRED_MARKER } from "./FormField";

interface FieldsetFieldProps {
	legend: string;
	/** Exibe "(obrigatório)" ao lado da legenda. */
	required?: boolean;
	/** Mensagem de validação do grupo, ligada ao `fieldset` para leitores de tela. */
	error?: string;
	className?: string;
	/** Opções do grupo (rádios ou caixas de seleção), cada uma com o próprio rótulo. */
	children: ReactNode;
}

/** Grupo de opções com legenda e mensagem de erro, no visual do `FormField`. */
export function FieldsetField({
	legend,
	required = false,
	error,
	className,
	children,
}: FieldsetFieldProps) {
	const errorId = useId();

	return (
		<fieldset
			className={cn("grid gap-2", className)}
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? errorId : undefined}
		>
			<legend className="mb-2 text-sm leading-snug font-medium">
				{legend}
				{required && (
					<>
						{" "}
						<span className="text-xs font-semibold text-destructive">{REQUIRED_MARKER}</span>
					</>
				)}
			</legend>
			{children}
			{error && (
				<p id={errorId} className="text-xs font-medium text-destructive animate-in fade-in">
					{error}
				</p>
			)}
		</fieldset>
	);
}
