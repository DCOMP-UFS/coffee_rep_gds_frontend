import { RequesterAbsence } from "../../../core/models/requester-absence.model";
import {
	filterAbsencesInVisibleRange,
	toExclusiveEndDate,
} from "./calendar-absence.util";

describe("calendar absence utils", () => {
	const absence: RequesterAbsence = {
		id: 1,
		solicitanteId: 2,
		solicitanteNome: "Dra. Ana Silva",
		dataInicio: "2026-05-19",
		dataFim: "2026-05-22",
	};

	it("filters absences that overlap the visible range", () => {
		const visible = filterAbsencesInVisibleRange(
			[absence],
			new Date(2026, 4, 1),
			new Date(2026, 5, 1),
		);

		expect(visible).toEqual([absence]);
	});

	it("builds an exclusive end date for all-day events", () => {
		expect(toExclusiveEndDate("2026-05-22")).toBe("2026-05-23");
	});
});
