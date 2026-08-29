import fs from "fs/promises";
import path from "path";

import { BrowserWindow, dialog, ipcMain } from "electron";
import settings from "electron-settings";

import { IPC, PreferenceValues } from "../../shared/ipc";
import { getTranslations } from "../i18n/i18n";
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

export default function initIpcListeners(diary: DiaryService): void {
	ipcMain.handle(IPC.app.getInfo, () => ({ name: parentWindow().getTitle(), version: process.env.npm_package_version || "" }));
	ipcMain.handle(IPC.app.getTranslations, () => getTranslations());
	ipcMain.handle(IPC.app.toggleWindowSize, (): void => {
		const win = parentWindow();
		if (win.isMaximized()) win.unmaximize();
		else win.maximize();
	});

	ipcMain.handle(IPC.diary.create, (_, password: string) => diary.create(password));
	ipcMain.handle(IPC.diary.fileExists, () => diary.fileExists());
	ipcMain.handle(IPC.diary.lock, (): void => diary.lock());
	ipcMain.handle(IPC.diary.read, (_, password: string) => diary.read(password));
	ipcMain.handle(IPC.diary.reset, () => diary.reset());
	ipcMain.handle(IPC.diary.save, (_, entries) => diary.save(entries));
	ipcMain.handle(IPC.diary.updatePassword, (_, password: string, entries) => diary.updatePassword(password, entries));

	ipcMain.handle(IPC.dialog.confirmReset, async (): Promise<boolean> => {
		const result = await dialog.showMessageBox(parentWindow(), { buttons: ["Reset diary", "Cancel"], defaultId: 1, message: "Delete this diary?", type: "warning" });
		return result.response === 0;
	});
	ipcMain.handle(IPC.dialog.selectDirectory, async (): Promise<string | null> => {
		const result = await dialog.showOpenDialog(parentWindow(), { properties: ["openDirectory"] });
		return result.canceled ? null : result.filePaths[0];
	});
	ipcMain.handle(IPC.dialog.selectImportFile, async (_, extensions: string[]): Promise<string | null> => {
		const result = await dialog.showOpenDialog(parentWindow(), { filters: [{ extensions, name: "Import file" }], properties: ["openFile"] });
		return result.canceled ? null : result.filePaths[0];
	});
	ipcMain.handle(IPC.dialog.selectExportPath, async (_, extension: string): Promise<string | null> => {
		const result = await dialog.showSaveDialog(parentWindow(), { filters: [{ extensions: [extension], name: extension.toUpperCase() }] });
		return result.canceled ? null : result.filePath || null;
	});
	ipcMain.handle(IPC.dialog.showError, async (_, title: string, message: string): Promise<void> => {
		await dialog.showMessageBox(parentWindow(), { message, title, type: "error" });
	});

	ipcMain.handle(IPC.files.moveDiary, (_, directory: string) => diary.moveTo(directory));
	ipcMain.handle(IPC.files.readText, (_, filePath: string) => fs.readFile(filePath, "utf8"));
	ipcMain.handle(IPC.files.writeExport, (_, filePath: string, content: string) => fs.writeFile(filePath, content, "utf8"));

	ipcMain.handle(IPC.preferences.get, (): PreferenceValues => {
		const filePath = (settings.get("filePath") as string) || diary.getDirectory();
		return { ...defaults, ...settings.get(), filePath } as PreferenceValues;
	});
	ipcMain.handle(IPC.preferences.set, (_, key: keyof PreferenceValues, value: PreferenceValues[keyof PreferenceValues]): void => {
		if (!(key in defaults)) throw Error("Invalid preference");
		settings.set(key, value);
		if (key === "filePath") void diary.setDirectory(value as string);
	});
}
