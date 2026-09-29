import { cloneElement, type ReactElement, useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const REQUIRED_MARKER = "(obrigatório)";

interface ControlProps {
	id?: string;
	"aria-invalid"?: boolean;
	"aria-describedby"?: string;
	"aria-required"?: boolean;
}

interface FormFieldProps {
	label: string;
	/** Exibe "(obrigatório)" ao lado do rótulo e marca o controle com `aria-required`. */
	required?: boolean;
	/** Mensagem de validação; quando presente, o controle é marcado como inválido. */
	error?: string;
	/** Orientação curta exibida abaixo do controle e anunciada junto com ele. */
	hint?: string;
	className?: string;
	/** Um único controle (input, select...), que recebe id e atributos de acessibilidade. */
	children: ReactElement<ControlProps>;
}

/** Rótulo, controle e mensagem de erro ligados entre si para leitores de tela. */
export function FormField({
	label,
	required = false,
	error,
	hint,
	className,
	children,
}: FormFieldProps) {
	const generatedId = useId();
	const id = children.props.id ?? generatedId;
	const errorId = `${id}-error`;
	const hintId = `${id}-hint`;
	const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

	return (
		<div className={cn("grid gap-1.5", className)}>
			<Label htmlFor={id} className="block leading-snug">
				{label}
				{required && (
					<>
						{" "}
						<span className="text-xs font-semibold text-destructive">{REQUIRED_MARKER}</span>
					</>
				)}
			</Label>
			{cloneElement(children, {
				id,
				"aria-invalid": error ? true : undefined,
				"aria-describedby": describedBy,
				"aria-required": required || undefined,
			})}
			{hint && (
				<p id={hintId} className="text-xs text-muted-foreground">
					{hint}
				</p>
			)}
			{error && (
				<p id={errorId} className="text-xs font-medium text-destructive animate-in fade-in">
					{error}
				</p>
			)}
		</div>
	);
}
