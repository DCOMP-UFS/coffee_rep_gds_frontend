import {
	absenceFormSchema,
	END_BEFORE_START_MESSAGE,
	REQUESTER_REQUIRED_MESSAGE,
	toAbsenceFormInput,
	toAbsenceWriteDto,
} from "./schemas";

const valid = { solicitanteId: 3, dataInicio: "05/01/2026", dataFim: "10/01/2026" };

const messageFor = (field: string, input: Record<string, unknown>) =>
	absenceFormSchema.safeParse(input).error?.issues.find((issue) => issue.path[0] === field)
		?.message;

describe("absenceFormSchema", () => {
	it("aceita um período válido", () => {
		expect(absenceFormSchema.safeParse(valid).success).toBe(true);
	});

	it("aceita início e fim no mesmo dia", () => {
		expect(absenceFormSchema.safeParse({ ...valid, dataFim: "05/01/2026" }).success).toBe(true);
	});

	it("exige o profissional e as duas datas", () => {
		const input = { solicitanteId: null, dataInicio: "", dataFim: "" };
		expect(messageFor("solicitanteId", input)).toBe(REQUESTER_REQUIRED_MESSAGE);
		expect(messageFor("dataInicio", input)).toBe("Informe a data de início.");
		expect(messageFor("dataFim", input)).toBe("Informe a data de fim.");
	});

	it("acusa data incompleta ou inexistente", () => {
		expect(messageFor("dataInicio", { ...valid, dataInicio: "05/01" })).toBe(
			"Informe a data no formato DD/MM/AAAA.",
		);
		expect(messageFor("dataFim", { ...valid, dataFim: "31/02/2026" })).toBe("Data inválida.");
	});

	// Regressão: no Angular, início depois do fim fazia o "Salvar" não fazer nada, sem mensagem.
	it("acusa, no campo de fim, fim anterior ao início", () => {
		expect(messageFor("dataFim", { ...valid, dataInicio: "11/01/2026" })).toBe(
			END_BEFORE_START_MESSAGE,
		);
	});

	it("compara as datas pelo calendário, não pelo texto", () => {
		expect(
			absenceFormSchema.safeParse({ ...valid, dataInicio: "31/12/2025", dataFim: "01/01/2026" })
				.success,
		).toBe(true);
	});
});

describe("conversões do formulário de ausência", () => {
	it("preenche o formulário com as datas em DD/MM/AAAA", () => {
		expect(
			toAbsenceFormInput({
				id: 1,
				solicitanteId: 3,
				solicitanteNome: "Ana",
				dataInicio: "2026-01-05",
				dataFim: "2026-01-10",
			}),
		).toEqual(valid);
		expect(toAbsenceFormInput()).toEqual({ solicitanteId: null, dataInicio: "", dataFim: "" });
	});

	it("envia as datas no formato ISO", () => {
		expect(toAbsenceWriteDto(absenceFormSchema.parse(valid))).toEqual({
			solicitanteId: 3,
			dataInicio: "2026-01-05",
			dataFim: "2026-01-10",
		});
	});
});
