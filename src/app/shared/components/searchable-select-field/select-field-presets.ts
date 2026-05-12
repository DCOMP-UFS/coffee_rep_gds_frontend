export type SelectFieldPresetKey =
	| "section"
	| "room"
	| "requester"
	| "status";

export interface SelectFieldPreset {
	emptyMessage: string;
	emptyInContextMessage?: string;
	dependencyMessage?: string;
	createRoute?: string;
	createActionLabel?: string;
	countLabelSingular: string;
	countLabelPlural: string;
	searchable: boolean;
}

export const SELECT_FIELD_PRESETS: Record<
	SelectFieldPresetKey,
	SelectFieldPreset
> = {
	section: {
		emptyMessage: "Nenhum setor cadastrado.",
		createRoute: "/sections",
		createActionLabel: "Cadastrar setor",
		countLabelSingular: "setor disponível",
		countLabelPlural: "setores disponíveis",
		searchable: true,
	},
	room: {
		emptyMessage: "Nenhuma sala cadastrada.",
		emptyInContextMessage: "Nenhuma sala neste setor.",
		dependencyMessage: "Selecione o setor acima para listar as salas disponíveis.",
		createRoute: "/rooms",
		createActionLabel: "Cadastrar sala",
		countLabelSingular: "sala disponível",
		countLabelPlural: "salas disponíveis",
		searchable: true,
	},
	requester: {
		emptyMessage: "Nenhum solicitante cadastrado.",
		createRoute: "/requester",
		createActionLabel: "Cadastrar solicitante",
		countLabelSingular: "solicitante disponível",
		countLabelPlural: "solicitantes disponíveis",
		searchable: true,
	},
	status: {
		emptyMessage: "Nenhuma opção disponível.",
		countLabelSingular: "opção disponível",
		countLabelPlural: "opções disponíveis",
		searchable: false,
	},
};
