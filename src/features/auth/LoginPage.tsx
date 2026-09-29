import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CircleCheck, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FormErrorAlert } from "@/components/feedback/FormErrorAlert";
import { FormField } from "@/components/form/FormField";
import { MaskedInput } from "@/components/form/MaskedInput";
import { PasswordInput } from "@/components/form/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { setToken } from "@/lib/auth/token";
import { maskCpf } from "@/shared/format/masks";
import { authApi } from "./api";
import { type LoginFormInput, type LoginFormValues, loginSchema, toLoginRequest } from "./schemas";

/** Mensagem única para qualquer falha de login, como no Angular: não revela se o CPF existe. */
export const LOGIN_ERROR_MESSAGE = "CPF ou senha incorretos. Tente novamente.";

/** Parâmetro com que o cadastro concluído chega ao login. */
export const REGISTERED_PARAM = "registered";
export const SIGN_UP_SUCCESS_MESSAGE = "Cadastro realizado. Faça login com seu CPF e senha.";

export function LoginPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const justRegistered = searchParams.has(REGISTERED_PARAM);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormInput, unknown, LoginFormValues>({
		resolver: zodResolver(loginSchema),
		mode: "onTouched",
		defaultValues: { cpf: "", password: "" },
	});

	const login = useMutation({
		mutationFn: authApi.login,
		onSuccess: ({ accessToken }) => {
			setToken(accessToken);
			navigate("/rooms");
		},
	});

	const clearLoginError = () => {
		if (login.isError) login.reset();
	};

	return (
		<div className="space-y-6">
			<header className="space-y-1.5">
				<h1 className="text-2xl font-bold text-primary">Bem-vindo de volta</h1>
				<p className="text-sm text-muted-foreground">
					Entre com seu CPF e senha para acessar o sistema.
				</p>
			</header>

			{justRegistered && !login.isError && (
				<Alert variant="success" role="status">
					<CircleCheck aria-hidden="true" />
					<AlertDescription>{SIGN_UP_SUCCESS_MESSAGE}</AlertDescription>
				</Alert>
			)}

			<form
				noValidate
				className="space-y-4"
				onSubmit={handleSubmit((values) => login.mutate(toLoginRequest(values)))}
				onChange={clearLoginError}
			>
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
						placeholder="Digite sua senha"
						autoComplete="current-password"
						{...register("password")}
					/>
				</FormField>

				{login.isError && <FormErrorAlert message={LOGIN_ERROR_MESSAGE} />}

				<Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
					{login.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
					Entrar
				</Button>
			</form>

			<p className="text-center text-sm text-muted-foreground">
				Ainda não possui acesso?{" "}
				<Link to="/cadastro" className="font-semibold text-ring hover:underline">
					Clique aqui.
				</Link>
			</p>
		</div>
	);
}
