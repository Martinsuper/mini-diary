import fs from "fs/promises";

import { app, BrowserWindow, dialog, ipcMain } from "electron";
import settings from "electron-settings";

import { IPC, PreferenceValues } from "../../shared/ipc";
import { getTranslations, getUsedLang } from "../i18n/i18n";
import DiaryService from "../services/diaryService";
import { getWindow } from "../window";

const defaults: PreferenceValues = {
	allowFutureEntries: false,
	enableSpellcheck: true,
	filePath: "",
	firstDayOfWeek: null,
	hideTitles: false,
	theme: "light",
};

function parentWindow(): BrowserWindow {
	return getWindow();
}

function preferences(): PreferenceValues {
	return Object.fromEntries(
		Object.entries(defaults).map(([key, value]) => [key, settings.get(key) ?? value]),
	) as PreferenceValues;
}

function exportExtension(defaultName: string): string {
	const extension = defaultName.split(".").pop();
	if (!extension || !/^[a-z0-9]+$/i.test(extension)) throw Error("Invalid export file name");
	return extension;
}

async function selectExportPath(defaultName: string, buttonLabel: string): Promise<string | null> {
	const extension = exportExtension(defaultName);
	const result = await dialog.showSaveDialog(parentWindow(), {
		buttonLabel,
		defaultPath: defaultName,
		filters: [{ extensions: [extension], name: extension.toUpperCase() }],
	});
	return result.canceled ? null : result.filePath || null;
}

export default function initIpcListeners(diary: DiaryService): void {
	ipcMain.handle(IPC.app.bootstrap, () => ({
		appName: app.name,
		lang: getUsedLang(),
		preferences: preferences(),
		translations: getTranslations(),
	}));
	ipcMain.handle(IPC.app.toggleWindowSize, (): void => {
		const win = parentWindow();
		if (win.isMaximized()) win.unmaximize();
		else win.maximize();
	});

	ipcMain.handle(IPC.diary.create, (_, password: string) => diary.create(password));
	ipcMain.handle(IPC.diary.fileExists, () => diary.fileExists());
	ipcMain.handle(IPC.diary.lock, () => diary.lock());
	ipcMain.handle(IPC.diary.read, (_, password: string) => diary.read(password));
	ipcMain.handle(IPC.diary.reset, () => diary.reset());
	ipcMain.handle(IPC.diary.save, (_, update) => diary.save(update));
	ipcMain.handle(IPC.diary.replaceEntries, (_, entries) => diary.replaceEntries(entries));
	ipcMain.handle(IPC.diary.updatePassword, (_, password: string, entries) => diary.updatePassword(password, entries));

	ipcMain.handle(IPC.dialogs.confirmReset, async (_, title: string, message: string, confirm: string, cancel: string): Promise<boolean> => {
		const result = await dialog.showMessageBox(parentWindow(), { buttons: [confirm, cancel], defaultId: 1, message, title, type: "warning" });
		return result.response === 0;
	});
	ipcMain.handle(IPC.dialogs.selectDirectory, async (_, buttonLabel: string): Promise<string | null> => {
		const result = await dialog.showOpenDialog(parentWindow(), { buttonLabel, properties: ["openDirectory"] });
		return result.canceled ? null : result.filePaths[0];
	});
	ipcMain.handle(IPC.dialogs.importFile, async (_, extension: "json" | "txt"): Promise<string | null> => {
		const result = await dialog.showOpenDialog(parentWindow(), {
			filters: [{ extensions: [extension], name: extension.toUpperCase() }],
			properties: ["openFile"],
		});
		return result.canceled ? null : fs.readFile(result.filePaths[0], "utf8");
	});
	ipcMain.handle(IPC.dialogs.exportFile, async (_, defaultName: string, buttonLabel: string, content: string): Promise<boolean> => {
		const filePath = await selectExportPath(defaultName, buttonLabel);
		if (!filePath) return false;
		await fs.writeFile(filePath, content, "utf8");
		return true;
	});
	ipcMain.handle(IPC.dialogs.exportPdf, async (_, defaultName: string, buttonLabel: string, markdown: string): Promise<boolean> => {
		const filePath = await selectExportPath(defaultName, buttonLabel);
		if (!filePath) return false;
		const pdfWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
		try {
			const html = `<!doctype html><meta charset="utf-8"><style>body{font:14px sans-serif;white-space:pre-wrap}</style><body>${markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body>`;
			await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
			await fs.writeFile(filePath, await pdfWindow.webContents.printToPDF({ pageSize: "A4" }));
			return true;
		} finally {
			pdfWindow.destroy();
		}
	});

	ipcMain.handle(IPC.diary.getPath, (): string => diary.getDirectory());
	ipcMain.handle(IPC.diary.move, async (_, directory: string): Promise<string> => {
		await diary.moveTo(directory);
		return diary.getDirectory();
	});
	ipcMain.handle(IPC.diary.setDirectory, (_, directory: string): Promise<void> => diary.setDirectory(directory));

	ipcMain.handle(IPC.preferences.set, async (_, key: keyof PreferenceValues, value: PreferenceValues[keyof PreferenceValues]): Promise<void> => {
		if (!(key in defaults)) throw Error("Invalid preference");
		settings.set(key, value);
		if (key === "filePath") await diary.setDirectory(value as string);
	});
}
