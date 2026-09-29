import { toast } from "sonner";
import { onSessionExpired } from "@/lib/auth/session-events";
import { getToken, setToken } from "@/lib/auth/token";
import {
	GENERIC_ERROR_MESSAGE,
	handleGlobalApiError,
	SESSION_EXPIRED_MESSAGE,
} from "./error-handler";
import { ApiError } from "./errors";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe("handleGlobalApiError", () => {
	afterEach(() => {
		vi.mocked(toast.error).mockClear();
	});

	it("em 401, avisa, descarta o token e dispara o evento de sessão expirada", () => {
		setToken("vencido");
		const listener = vi.fn();
		const unsubscribe = onSessionExpired(listener);

		handleGlobalApiError(new ApiError(401, "section", undefined));

		expect(toast.error).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
		expect(getToken()).toBeNull();
		expect(listener).toHaveBeenCalledOnce();
		unsubscribe();
	});

	it("em 401 com mensagem do backend, mostra a mensagem do backend", () => {
		handleGlobalApiError(new ApiError(401, "room", { message: "Token inválido." }));

		expect(toast.error).toHaveBeenCalledWith("Token inválido.");
	});

	it("nos demais erros, mostra a mensagem do backend", () => {
		handleGlobalApiError(new ApiError(422, "room/1", { message: "Sala possui reservas." }));

		expect(toast.error).toHaveBeenCalledWith("Sala possui reservas.");
	});

	it("sem mensagem apresentável, usa o fallback genérico", () => {
		handleGlobalApiError(new ApiError(500, "room", {}));

		expect(toast.error).toHaveBeenCalledWith(GENERIC_ERROR_MESSAGE);
	});

	it("usa o fallback específico da operação quando informado", () => {
		handleGlobalApiError(new ApiError(500, "room/1", {}), {
			errorFallback: "Não foi possível excluir a sala. Tente novamente.",
		});

		expect(toast.error).toHaveBeenCalledWith("Não foi possível excluir a sala. Tente novamente.");
	});

	it("trata falhas de rede com o fallback", () => {
		handleGlobalApiError(new TypeError("Failed to fetch"));

		expect(toast.error).toHaveBeenCalledWith(GENERIC_ERROR_MESSAGE);
	});

	it.each(["auth/login", "auth/register"])(
		"ignora erros de %s, que têm mensagens próprias",
		(path) => {
			setToken("mantido");

			handleGlobalApiError(new ApiError(401, path, undefined));

			expect(toast.error).not.toHaveBeenCalled();
			expect(getToken()).toBe("mantido");
		},
	);

	it("com inlineError, deixa o erro para a tela", () => {
		handleGlobalApiError(new ApiError(409, "room/1", { message: "Conflito." }), {
			inlineError: true,
		});

		expect(toast.error).not.toHaveBeenCalled();
	});

	it("com inlineError, ainda trata a sessão expirada", () => {
		setToken("vencido");
		const listener = vi.fn();
		const unsubscribe = onSessionExpired(listener);

		handleGlobalApiError(new ApiError(401, "room/1", undefined), { inlineError: true });

		expect(toast.error).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
		expect(getToken()).toBeNull();
		expect(listener).toHaveBeenCalledOnce();
		unsubscribe();
	});

	it("respeita silentError", () => {
		handleGlobalApiError(new ApiError(500, "room", {}), { silentError: true });

		expect(toast.error).not.toHaveBeenCalled();
	});
});
