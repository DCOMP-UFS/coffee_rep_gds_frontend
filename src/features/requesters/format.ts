import type { Requester } from "./types";

/** Rótulo dos selects de profissional: `Nome - Especialidade`, ou só o nome sem especialidade. */
export const requesterOptionLabel = (requester: Pick<Requester, "nome" | "especialidade">) =>
	requester.especialidade ? `${requester.nome} - ${requester.especialidade}` : requester.nome;
