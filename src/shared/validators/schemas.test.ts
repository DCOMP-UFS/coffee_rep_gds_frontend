import {
	brDateSchema,
	CPF_MESSAGE,
	cpfSchema,
	optionalBrDateSchema,
	requiredText,
	TIME_FORMAT_MESSAGE,
	timeSchema,
} from "./schemas";

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
	result.error?.issues[0]?.message;

describe("requiredText", () => {
	it("apara o valor", () => {
		expect(requiredText("Informe o nome.").parse("  Pediatria ")).toBe("Pediatria");
	});

	it("rejeita texto só com espaços", () => {
		expect(firstMessage(requiredText("Informe o nome.").safeParse("   "))).toBe("Informe o nome.");
	});
});

describe("cpfSchema", () => {
	it("aceita CPF mascarado e devolve só dígitos", () => {
		expect(cpfSchema.parse("529.982.247-25")).toBe("52998224725");
	});

	it("rejeita CPF incompleto com a mensagem do Angular", () => {
		expect(firstMessage(cpfSchema.safeParse("529.982"))).toBe(CPF_MESSAGE);
	});
});

describe("brDateSchema", () => {
	const schema = brDateSchema("a data de nascimento", { allowFuture: false });

	it("exige preenchimento", () => {
		expect(firstMessage(schema.safeParse(""))).toBe("Informe a data de nascimento.");
	});

	it("acusa formato incompleto", () => {
		expect(firstMessage(schema.safeParse("01/01"))).toBe("Informe a data no formato DD/MM/AAAA.");
	});

	it("acusa data inválida", () => {
		expect(firstMessage(schema.safeParse("31/02/2000"))).toBe("Data inválida.");
	});

	it("aceita data válida", () => {
		expect(schema.safeParse("05/03/1990").success).toBe(true);
	});
});

describe("optionalBrDateSchema", () => {
	const schema = optionalBrDateSchema();

	it("aceita vazio", () => {
		expect(schema.parse("  ")).toBe("");
	});

	it("valida a data quando preenchida", () => {
		expect(firstMessage(schema.safeParse("01/01"))).toBe("Informe a data no formato DD/MM/AAAA.");
		expect(firstMessage(schema.safeParse("31/02/2000"))).toBe("Data inválida.");
		expect(schema.parse("05/03/2026")).toBe("05/03/2026");
	});
});

describe("timeSchema", () => {
	const schema = timeSchema("Informe o horário de início.");

	it("exige preenchimento, com uma única mensagem", () => {
		const result = schema.safeParse("  ");
		expect(result.error?.issues.map((issue) => issue.message)).toEqual([
			"Informe o horário de início.",
		]);
	});

	it.each(["8:00", "24:00", "12:60", "12"])("acusa formato inválido: %s", (value) => {
		expect(firstMessage(schema.safeParse(value))).toBe(TIME_FORMAT_MESSAGE);
	});

	it("aceita e apara horário válido", () => {
		expect(schema.parse(" 08:30 ")).toBe("08:30");
	});
});
