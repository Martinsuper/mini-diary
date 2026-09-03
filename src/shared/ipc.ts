import { Entries, IndexDate, DiaryEntry, Metadata } from "../renderer/types";
import { OverlayType } from "./types";

export const IPC = {
	app: {
		bootstrap: "app:bootstrap",
		toggleWindowSize: "app:toggle-window-size",
	},
	dialogs: {
		confirmReset: "dialogs:confirm-reset",
		exportFile: "dialogs:export-file",
		exportPdf: "dialogs:export-pdf",
		importFile: "dialogs:import-file",
		selectDirectory: "dialogs:select-directory",
		showError: "dialogs:show-error",
	},
	diary: {
		create: "diary:create",
		fileExists: "diary:file-exists",
		getPath: "diary:get-path",
		lock: "diary:lock",
		move: "diary:move",
		read: "diary:read",
		replaceEntries: "diary:replace-entries",
		reset: "diary:reset",
		save: "diary:save",
		setDirectory: "diary:set-directory",
		updatePassword: "diary:update-password",
	},
	preferences: { set: "preferences:set" },
} as const;

export type MenuEvent =
	| "nextDay"
	| "previousDay"
	| "goToToday"
	| "nextMonth"
	| "previousMonth"
	| "exportJsonMiniDiary"
	| "exportMd"
	| "exportPdf"
	| "exportTxtDayOne"
	| "importJsonDayOne"
	| "importJsonJrnl"
	| "importJsonMiniDiary"
	| "importTxtDayOne"
	| "lock";

export interface DiaryPayload {
	entries: Entries;
	metadata: Metadata;
}

export interface DiaryEntryUpdate {
	entry: DiaryEntry | null;
	indexDate: IndexDate;
}

export interface PreferenceValues {
	allowFutureEntries: boolean;
	enableSpellcheck: boolean;
	filePath: string;
	firstDayOfWeek: number | null;
	hideTitles: boolean;
	theme: "auto" | "dark" | "light";
}

export interface BootstrapData {
	appName: string;
	lang: string;
	preferences: PreferenceValues;
	translations: Record<string, string>;
}

export interface MiniDiaryApi {
	app: {
		bootstrap: () => Promise<BootstrapData>;
		toggleWindowSize: () => Promise<void>;
	};
	dialogs: {
		confirmReset: (title: string, message: string, confirm: string, cancel: string) => Promise<boolean>;
		exportFile: (defaultName: string, buttonLabel: string, content: string) => Promise<boolean>;
		exportPdf: (defaultName: string, buttonLabel: string, markdown: string) => Promise<boolean>;
		importFile: (extension: "json" | "txt") => Promise<string | null>;
		selectDirectory: (buttonLabel: string) => Promise<string | null>;
		showError: (title: string, message: string) => Promise<void>;
	};
	diary: {
		create: (password: string) => Promise<DiaryPayload>;
		fileExists: () => Promise<boolean>;
		getPath: () => Promise<string>;
		lock: () => Promise<void>;
		move: (directory: string) => Promise<string>;
		read: (password: string) => Promise<DiaryPayload>;
		reset: () => Promise<void>;
		save: (update: DiaryEntryUpdate) => Promise<void>;
		replaceEntries: (entries: Entries) => Promise<void>;
		setDirectory: (directory: string) => Promise<void>;
		updatePassword: (password: string, entries: Entries) => Promise<DiaryPayload>;
	};
	events: {
		onMenu: (listener: (event: MenuEvent, overlay?: OverlayType) => void) => () => void;
		onThemeChange: (listener: (theme: "light" | "dark") => void) => () => void;
	};
	preferences: {
		set: (key: keyof PreferenceValues, value: PreferenceValues[keyof PreferenceValues]) => Promise<void>;
	};
}
