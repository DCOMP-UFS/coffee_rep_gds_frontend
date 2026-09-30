import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, Info, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { FormErrorAlert } from "@/components/feedback/FormErrorAlert";
import { FormField } from "@/components/form/FormField";
import { MaskedInput } from "@/components/form/MaskedInput";
import { PasswordInput } from "@/components/form/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleHierarchy } from "@/features/session/RoleHierarchy";
import { getSignUpErrorMessage } from "@/lib/api/errors";
import { maskCpf, maskDate, maskPhone } from "@/shared/format/masks";
import { authApi } from "./api";
import { REGISTERED_PARAM } from "./LoginPage";
import {
	type SignUpFormInput,
	type SignUpFormValues,
	signUpSchema,
	toSignUpRequest,
} from "./schemas";

export const SIGN_UP_ACCESS_NOTICE = "Sua conta começa com o perfil Visualizador.";

export function SignUpPage() {
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignUpFormInput, unknown, SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		mode: "onTouched",
		defaultValues: { name: "", phone: "", email: "", cpf: "", birthDate: "", password: "" },
	});

	const signUp = useMutation({
		mutationFn: authApi.signUp,
		onSuccess: () => navigate(`/login?${REGISTERED_PARAM}=1`),
	});

	const clearSignUpError = () => {
		if (signUp.isError) signUp.reset();
	};

	return (
		<div className="space-y-6">
			<Link
				to="/login"
				className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
			>
				<ChevronLeft className="size-4" aria-hidden="true" />
				Voltar
			</Link>

			<header className="space-y-1.5">
				<h1 className="text-2xl font-bold text-primary">Criar acesso</h1>
				<p className="text-sm text-muted-foreground">
					Preencha seus dados. Depois, é só entrar com seu CPF e senha.
				</p>
			</header>

			<section aria-labelledby="sign-up-access-title" className="grid gap-3">
				<div className="flex gap-3 rounded-lg border border-brand-blue/20 bg-accent/60 p-3 text-sm">
					<Info className="mt-0.5 size-4 shrink-0 text-brand-blue" aria-hidden="true" />
					<div className="grid gap-1">
						<h2 id="sign-up-access-title" className="font-semibold text-foreground">
							{SIGN_UP_ACCESS_NOTICE}
						</h2>
						<p className="text-muted-foreground">
							Ele permite consultar o sistema, sem alterar nada. Se o seu trabalho exigir mais, peça
							um nível maior em “Meu acesso” depois de entrar; o administrador analisa o pedido.
						</p>
					</div>
				</div>
				<RoleHierarchy compact />
			</section>

			<form
				noValidate
				className="grid gap-4 sm:grid-cols-2 sm:items-end"
				onSubmit={handleSubmit((values) => signUp.mutate(toSignUpRequest(values)))}
				onChange={clearSignUpError}
			>
				<FormField label="Nome" required error={errors.name?.message} className="sm:col-span-2">
					<Input placeholder="Nome completo" autoComplete="name" {...register("name")} />
				</FormField>

				<FormField label="Telefone" required error={errors.phone?.message}>
					<MaskedInput
						mask={maskPhone}
						type="tel"
						placeholder="(00) 00000-0000"
						autoComplete="tel"
						{...register("phone")}
					/>
				</FormField>

				<FormField label="Data de nascimento" required error={errors.birthDate?.message}>
					<MaskedInput
						mask={maskDate}
						placeholder="DD/MM/AAAA"
						autoComplete="bday"
						{...register("birthDate")}
					/>
				</FormField>

				<FormField label="E-mail" required error={errors.email?.message} className="sm:col-span-2">
					<Input
						type="email"
						placeholder="Seu melhor e-mail"
						autoComplete="email"
						{...register("email")}
					/>
				</FormField>

				<FormField label="CPF" required error={errors.cpf?.message}>
					<MaskedInput
						mask={maskCpf}
						placeholder="000.000.000-00"
						autoComplete="username"
						{...register("cpf")}
					/>
				</FormField>

				<FormField label="Senha" required error={errors.password?.message}>
					<PasswordInput
						placeholder="Crie uma senha"
						autoComplete="new-password"
						{...register("password")}
					/>
				</FormField>

				{signUp.isError && (
					<FormErrorAlert message={getSignUpErrorMessage(signUp.error)} className="sm:col-span-2" />
				)}

				<Button
					type="submit"
					size="lg"
					className="w-full sm:col-span-2"
					disabled={signUp.isPending}
				>
					{signUp.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
					Cadastre-se
				</Button>
			</form>
		</div>
	);
}
