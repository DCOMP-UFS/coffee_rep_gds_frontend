import { formatAuditDetails } from "./format-details";

describe("formatAuditDetails", () => {
	it("devolve vazio sem detalhes", () => {
		expect(formatAuditDetails(null)).toBe("");
		expect(formatAuditDetails({})).toBe("");
	});

	it("usa rótulos em português e omite o número quando o nome veio", () => {
		expect(
			formatAuditDetails({
				salaId: 3,
				sala: "Consultório 3",
				solicitanteId: 7,
				solicitante: "Ana Souza",
				recorrente: true,
				recorrenciaId: 50,
				ocorrencias: 4,
			}),
		).toBe(
			"Sala: Consultório 3 · Solicitante: Ana Souza · Recorrente: sim · Série: #50 · Ocorrências: 4",
		);
	});

	it("mostra o número quando o nome não veio", () => {
		expect(formatAuditDetails({ nome: "Consultório 3", setorId: 2 })).toBe(
			"Nome: Consultório 3 · Setor: #2",
		);
		expect(formatAuditDetails({ salaId: 3, solicitanteId: 7 })).toBe("Sala: #3 · Solicitante: #7");
	});

	it("formata datas e horários no padrão brasileiro", () => {
		expect(
			formatAuditDetails({ horaInicio: "2026-10-05T08:00:00", horaFim: "2026-10-05T09:30:00" }),
		).toBe("Início: 05/10/2026 08:00 · Fim: 05/10/2026 09:30");
		expect(
			formatAuditDetails({
				solicitanteId: 7,
				solicitanteNome: "Ana Souza",
				dataInicio: "2026-10-01",
				dataFim: "2026-10-10",
			}),
		).toBe("Solicitante: Ana Souza · Início: 01/10/2026 · Fim: 10/10/2026");
	});

	it("traduz booleanos e o perfil", () => {
		expect(formatAuditDetails({ cancelada: false, reativado: true })).toBe(
			"Cancelada: não · Reativado: sim",
		);
		expect(formatAuditDetails({ role: "ADMIN" })).toBe("Perfil: Administrador");
		expect(formatAuditDetails({ role: "OUTRO" })).toBe("Perfil: OUTRO");
	});

	it("esconde chaves da importação e valores vazios", () => {
		expect(
			formatAuditDetails({
				nome: "Pediatria",
				backfill: true,
				backfillSource: "sections",
				backfillSourceId: 4,
				actorInferred: true,
				email: "",
				role: null,
			}),
		).toBe("Nome: Pediatria");
	});

	it("mostra chaves desconhecidas como vieram", () => {
		expect(formatAuditDetails({ motivo: "Teste", constructor: "x" })).toBe(
			"motivo: Teste · constructor: x",
		);
	});
});
