import { Requester } from "../../../core/models/requester-response.model";
import { Room } from "../../../core/models/room-response.model";
import { Section } from "../../../core/models/section-response.model";
import { SearchableSelectOption } from "./searchable-select-field.component";

export function mapSectionOptions(sections: Section[]): SearchableSelectOption[] {
	return sections.map((section) => ({
		value: String(section.id),
		label: section.nome,
	}));
}

export function mapRoomOptions(rooms: Room[]): SearchableSelectOption[] {
	return rooms.map((room) => ({
		value: String(room.id),
		label: room.nome,
	}));
}

export function mapRequesterOptions(
	requesters: Requester[],
): SearchableSelectOption[] {
	return requesters.map((requester) => ({
		value: String(requester.id),
		label: `${requester.nome} - ${requester.especialidade}`,
	}));
}
