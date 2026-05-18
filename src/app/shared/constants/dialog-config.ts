/** Classe aplicada ao container do MatDialog para layout flexível com área rolável. */
export const FORM_DIALOG_PANEL_CLASS = "form-dialog-panel";

export const FORM_DIALOG_CONFIG = {
	width: "min(95vw, 520px)",
	maxHeight: "min(90vh, 100dvh)",
	panelClass: FORM_DIALOG_PANEL_CLASS,
} as const;

export const FORM_DIALOG_CONFIG_NARROW = {
	width: "min(95vw, 480px)",
	maxHeight: "min(90vh, 100dvh)",
	panelClass: FORM_DIALOG_PANEL_CLASS,
} as const;
