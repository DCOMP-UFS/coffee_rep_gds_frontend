import {
	PHONE_MESSAGE,
	requesterFormSchema,
	toRequesterFormInput,
	toRequesterWriteDto,
} from "./schemas";

const valid = { nome: "Ana Souza", telefone: "", especialidade: "Cardiologia" };

const messageFor = (field: string, input: Record<string, string>) =>
	requesterFormSchema.safeParse(input).error?.issues.find((issue) => issue.path[0] === field)
		?.message;

describe("requesterFormSchema", () => {
	it("apara nome e especialidade", () => {
		const values = requesterFormSchema.parse({
			nome: "  Ana Souza ",
			telefone: "",
			especialidade: " Cardiologia ",
		});
		expect(values).toMatchObject({ nome: "Ana Souza", especialidade: "Cardiologia" });
	});

	// Regressão: no Angular, nome só com espaços passava e, na edição, o backend mantinha o
	// nome antigo sem avisar.
	it("rejeita nome e especialidade só com espaços", () => {
		const input = { nome: "   ", telefone: "", especialidade: "  " };
		expect(messageFor("nome", input)).toBe("Informe o nome.");
		expect(messageFor("especialidade", input)).toBe("Informe a especialidade.");
	});

	it("converte telefone vazio em null", () => {
		expect(requesterFormSchema.parse(valid).telefone).toBeNull();
	});

	it.each([
		["(79) 3333-4444", "7933334444"],
		["(79) 99988-7766", "79999887766"],
	])("aceita %s e envia só os dígitos", (telefone, digits) => {
		expect(requesterFormSchema.parse({ ...valid, telefone }).telefone).toBe(digits);
	});

	it.each(["(79) 9998", "799"])("rejeita telefone incompleto %s", (telefone) => {
		expect(messageFor("telefone", { ...valid, telefone })).toBe(PHONE_MESSAGE);
	});
});

describe("conversões do formulário de solicitante", () => {
	it("preenche o formulário com o telefone mascarado e campos ausentes vazios", () => {
		expect(toRequesterFormInput({ id: 1, nome: "Ana", contato: "79999887766" })).toEqual({
			nome: "Ana",
			telefone: "(79) 99988-7766",
			especialidade: "",
		});
		expect(toRequesterFormInput()).toEqual({ nome: "", telefone: "", especialidade: "" });
	});

	it("monta o corpo de escrita com o nome do campo do backend", () => {
		const values = requesterFormSchema.parse({ ...valid, telefone: "(79) 3333-4444" });
		expect(toRequesterWriteDto(values)).toEqual({
			nome: "Ana Souza",
			telefone: "7933334444",
			especialidade: "Cardiologia",
		});
	});
});
