import { OverlayType, Translations } from "../shared/types";
import { ThemePref, Weekday } from "./types";

type MenuEvent =
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

interface PreferencesApi {
	get: <T>(key: string) => T;
	set: (key: string, value: boolean | ThemePref | Weekday | null | string) => Promise<void>;
}

declare global {
	interface Window {
		miniDiary: {
			app: {
				getLang: () => string;
				getName: () => string;
				getTranslations: () => Record<string, string>;
				getTranslation: (key: keyof Translations, substitutions: Record<string, string>) => string;
				toggleWindowSize: () => Promise<void>;
			};
			dialogs: {
				confirmReset: (title: string, message: string, confirm: string, cancel: string) => Promise<boolean>;
				selectDirectory: (buttonLabel: string) => Promise<string | null>;
				selectExportPath: (defaultName: string, buttonLabel: string) => Promise<string | null>;
				selectImportFile: (extension: string) => Promise<string | null>;
				showError: (title: string, message: string) => Promise<void>;
			};
			diary: {
				create: (password: string) => Promise<{ entries: import("./types").Entries }>;
				fileExists: () => Promise<boolean>;
				getPath: () => Promise<string>;
				lock: () => Promise<void>;
				move: (directory: string) => Promise<string>;
				read: (password: string) => Promise<{ entries: import("./types").Entries }>;
				readTextFile: (filePath: string) => Promise<string>;
				reset: () => Promise<void>;
				save: (entries: import("./types").Entries) => Promise<{ entries: import("./types").Entries }>;
				setDirectory: (directory: string) => Promise<void>;
				updatePassword: (password: string, entries: import("./types").Entries) => Promise<{ entries: import("./types").Entries }>;
				writeExport: (filePath: string, content: string) => Promise<void>;
				writePdfExport: (filePath: string, markdown: string) => Promise<void>;
			};
			events: {
				onMenu: (listener: (event: MenuEvent, overlay?: OverlayType) => void) => () => void;
				onThemeChange: (listener: (theme: "light" | "dark") => void) => () => void;
			};
			preferences: PreferencesApi;
		};
	}
}

export {};
