import { maskCpf, maskDate, maskFlexiblePhone, maskPhone, maskTime } from "./masks";

describe("masks", () => {
	it.each([
		["", ""],
		["529", "529"],
		["5299", "529.9"],
		["52998224725", "529.982.247-25"],
		["529.982.247-25", "529.982.247-25"],
		["5299822472599", "529.982.247-25"],
	])("maskCpf(%j) = %j", (input, expected) => {
		expect(maskCpf(input)).toBe(expected);
	});

	it.each([
		["1", "(1"],
		["11", "(11"],
		["119", "(11) 9"],
		["11987654321", "(11) 98765-4321"],
	])("maskPhone(%j) = %j", (input, expected) => {
		expect(maskPhone(input)).toBe(expected);
	});

	it.each([
		["", ""],
		["7", "(7"],
		["799", "(79) 9"],
		["793333444", "(79) 3333-444"],
		["7933334444", "(79) 3333-4444"],
		["79999887766", "(79) 99988-7766"],
		["(79) 99988-7766", "(79) 99988-7766"],
		["799998877661", "(79) 99988-7766"],
	])("maskFlexiblePhone(%j) = %j", (input, expected) => {
		expect(maskFlexiblePhone(input)).toBe(expected);
	});

	it.each([
		["01", "01"],
		["010", "01/0"],
		["01012024", "01/01/2024"],
		["010120241", "01/01/2024"],
	])("maskDate(%j) = %j", (input, expected) => {
		expect(maskDate(input)).toBe(expected);
	});

	it.each([
		["8", "8"],
		["08", "08"],
		["083", "08:3"],
		["0830", "08:30"],
		["2599", "23:59"],
	])("maskTime(%j) = %j", (input, expected) => {
		expect(maskTime(input)).toBe(expected);
	});
});
