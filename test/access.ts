import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { onTestFinished } from "vitest";
import type { RoleRequest } from "@/features/role-requests/types";
import { ACCESS_REQUIRED_TITLE } from "@/features/session/access-dialog/AccessRequiredDialog";
import { apiUrl, server } from "./msw/server";

/** Pedidos do usuário logado, que a explicação de acesso consulta ao abrir. */
export function mockMyRoleRequests(requests: RoleRequest[] = []) {
	server.use(http.get(apiUrl("role-request/me"), () => HttpResponse.json(requests)));
}

/** Requisições de escrita feitas até o fim do teste; uma ação bloqueada não pode gerar nenhuma. */
export function recordWrites(): string[] {
	const writes: string[] = [];
	const listener = ({ request }: { request: Request }) => {
		if (request.method !== "GET") writes.push(`${request.method} ${request.url}`);
	};
	server.events.on("request:start", listener);
	onTestFinished(() => {
		server.events.removeListener("request:start", listener);
	});
	return writes;
}

/** Ações bloqueadas com esse nome: continuam na tela e o nome acessível traz o motivo. */
export function getLockedButtons(name: RegExp): HTMLElement[] {
	const buttons = screen.getAllByRole("button", { name });
	for (const button of buttons) expect(button).toHaveAttribute("aria-disabled", "true");
	return buttons;
}

export function getLockedButton(name: RegExp): HTMLElement {
	const [button, ...others] = getLockedButtons(name);
	expect(others).toHaveLength(0);
	return button as HTMLElement;
}

/** Clica na ação bloqueada e devolve o modal "Acesso necessário". */
export async function openAccessDialog(user: UserEvent, button: HTMLElement) {
	await user.click(button);
	return screen.findByRole("dialog", { name: ACCESS_REQUIRED_TITLE });
}
