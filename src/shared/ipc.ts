import { Entries, Metadata } from "../renderer/types";
import { OverlayType, Translations } from "./types";

export const IPC = {
	app: { getInfo: "app:get-info", getTranslations: "app:get-translations", toggleWindowSize: "app:toggle-window-size" },
	diary: { create: "diary:create", fileExists: "diary:file-exists", lock: "diary:lock", read: "diary:read", reset: "diary:reset", save: "diary:save", updatePassword: "diary:update-password" },
	dialog: { confirmReset: "dialog:confirm-reset", selectDirectory: "dialog:select-directory", selectExportPath: "dialog:select-export-path", selectImportFile: "dialog:select-import-file", showError: "dialog:show-error" },
	files: { moveDiary: "files:move-diary", readText: "files:read-text", writeExport: "files:write-export" },
	preferences: { get: "preferences:get", set: "preferences:set" },
} as const;

export type RendererEvent =
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

export interface PreferenceValues {
	allowFutureEntries: boolean;
	enableSpellcheck: boolean;
	filePath: string;
	firstDayOfWeek: number | null;
	hideTitles: boolean;
	theme: "auto" | "dark" | "light";
}

export interface MiniDiaryApi {
	app: {
		getInfo: () => Promise<{ name: string; version: string }>;
		getTranslations: () => Promise<Partial<Translations>>;
		on: (event: RendererEvent, listener: () => void) => () => void;
		toggleWindowSize: () => Promise<void>;
	};
	diary: {
		create: (password: string) => Promise<DiaryPayload>;
		fileExists: () => Promise<boolean>;
		lock: () => Promise<void>;
		read: (password: string) => Promise<DiaryPayload>;
		reset: () => Promise<void>;
		save: (entries: Entries) => Promise<DiaryPayload>;
		updatePassword: (password: string, entries: Entries) => Promise<DiaryPayload>;
	};
	dialog: {
		confirmReset: () => Promise<boolean>;
		selectExportPath: (extension: string) => Promise<string | null>;
		selectImportFile: (extensions: string[]) => Promise<string | null>;
		selectDirectory: () => Promise<string | null>;
		showError: (title: string, message: string) => Promise<void>;
	};
	files: {
		moveDiary: (directory: string) => Promise<void>;
		readText: (filePath: string) => Promise<string>;
		writeExport: (filePath: string, content: string) => Promise<void>;
	};
	preferences: {
		get: () => Promise<PreferenceValues>;
		set: <K extends keyof PreferenceValues>(key: K, value: PreferenceValues[K]) => Promise<void>;
	};
}
