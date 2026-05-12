import {
	endTimeAfterStartValidator,
	timeFormatValidator,
} from "./time.validators";

describe("time validators", () => {
	it("should accept valid HH:MM values", () => {
		expect(timeFormatValidator({ value: "08:30" } as never)).toBeNull();
	});

	it("should reject invalid time values", () => {
		expect(timeFormatValidator({ value: "25:00" } as never)).toEqual({
			timeFormat: true,
		});
	});

	it("should require end time after start time", () => {
		const group = {
			get: (name: string) => ({
				value: name === "horaInicio" ? "10:00" : "09:00",
			}),
		};

		expect(endTimeAfterStartValidator(group as never)).toEqual({
			endBeforeStart: true,
		});
	});
});
