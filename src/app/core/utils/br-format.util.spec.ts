import { formatCpfBr, formatPhoneBr } from "./br-format.util";

describe("br format utils", () => {
	it("should format CPF with mask", () => {
		expect(formatCpfBr("52998224725")).toBe("529.982.247-25");
	});

	it("should format mobile phone with mask", () => {
		expect(formatPhoneBr("11987654321")).toBe("(11) 98765-4321");
	});

	it("should format landline phone with mask", () => {
		expect(formatPhoneBr("1133334444")).toBe("(11) 3333-4444");
	});
});
