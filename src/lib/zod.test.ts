import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("configuração do Zod", () => {
	it("usa mensagens padrão em português", () => {
		const result = z.string().safeParse(1);

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toMatch(/^Entrada inválida/);
	});
});
