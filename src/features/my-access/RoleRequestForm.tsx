import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormErrorAlert } from "@/components/feedback/FormErrorAlert";
import { FieldsetField } from "@/components/form/FieldsetField";
import { FormField } from "@/components/form/FormField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_REQUEST_ERROR_MESSAGES, useCreateRoleRequest } from "@/features/role-requests/hooks";
import { ROLE_HIERARCHY, ROLE_LABELS } from "@/features/session/roles";
import type { RequestableRole } from "@/features/session/types";
import { getHttpErrorMessage } from "@/lib/api/errors";
import {
	JUSTIFICATION_MAX_LENGTH,
	type RoleRequestFormInput,
	type RoleRequestFormValues,
	roleRequestFormSchema,
	toCreateRoleRequestDto,
} from "./schemas";

export const ROLE_REQUEST_SENT_MESSAGE = "Pedido enviado. O administrador vai analisá-lo.";

const summaryOf = (role: RequestableRole) =>
	ROLE_HIERARCHY.find((description) => description.role === role)?.summary;

interface RoleRequestFormProps {
	/** Perfis acima do atual, do menor para o maior; o primeiro vem marcado. */
	roles: RequestableRole[];
}

export function RoleRequestForm({ roles }: RoleRequestFormProps) {
	const create = useCreateRoleRequest();

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RoleRequestFormInput, unknown, RoleRequestFormValues>({
		resolver: zodResolver(roleRequestFormSchema),
		mode: "onTouched",
		defaultValues: { requestedRole: roles[0], justification: "" },
	});
	const justificationLength = useWatch({ control, name: "justification" }).trim().length;

	const clearCreateError = () => {
		if (create.isError) create.reset();
	};

	const onSubmit = handleSubmit((values) =>
		create.mutate(toCreateRoleRequestDto(values), {
			onSuccess: () => toast.success(ROLE_REQUEST_SENT_MESSAGE),
		}),
	);

	return (
		<form noValidate className="grid gap-4" onSubmit={onSubmit} onChange={clearCreateError}>
			<Controller
				control={control}
				name="requestedRole"
				render={({ field, fieldState }) => (
					<FieldsetField legend="Perfil desejado" required error={fieldState.error?.message}>
						<RadioGroup
							value={field.value}
							onValueChange={(value) => {
								clearCreateError();
								field.onChange(value as RequestableRole);
							}}
							disabled={create.isPending}
							className="grid gap-2"
						>
							{roles.map((role) => (
								<Label
									key={role}
									htmlFor={`requested-role-${role}`}
									className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-[state=checked]:border-brand-blue/40 has-data-[state=checked]:bg-accent/60"
								>
									<RadioGroupItem value={role} id={`requested-role-${role}`} className="mt-0.5" />
									<span className="grid gap-0.5">
										<span className="font-semibold">{ROLE_LABELS[role]}</span>
										<span className="text-xs text-muted-foreground">{summaryOf(role)}</span>
									</span>
								</Label>
							))}
						</RadioGroup>
					</FieldsetField>
				)}
			/>

			<FormField
				label="Justificativa"
				required
				error={errors.justification?.message}
				hint={`Conte o que você precisa fazer no sistema (${justificationLength}/${JUSTIFICATION_MAX_LENGTH}).`}
			>
				<Textarea
					rows={4}
					maxLength={JUSTIFICATION_MAX_LENGTH}
					placeholder="Ex.: Sou da secretaria do ambulatório e preciso marcar as reservas pontuais das salas."
					disabled={create.isPending}
					{...register("justification")}
				/>
			</FormField>

			{create.isError && (
				<FormErrorAlert
					message={getHttpErrorMessage(create.error, ROLE_REQUEST_ERROR_MESSAGES.create)}
				/>
			)}

			<Button type="submit" className="justify-self-start" disabled={create.isPending}>
				{create.isPending ? (
					<Loader2 className="animate-spin" aria-hidden="true" />
				) : (
					<Send aria-hidden="true" />
				)}
				{create.isPending ? "Enviando…" : "Enviar pedido"}
			</Button>
		</form>
	);
}
