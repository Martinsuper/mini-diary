import { contextBridge, ipcRenderer } from "electron";

import { IPC, MenuEvent, MiniDiaryApi } from "../shared/ipc";
import { OverlayType } from "../shared/types";

function subscribe<T>(channel: string, listener: (value: T) => void): () => void {
	const wrapped = (_: Electron.IpcRendererEvent, value: T): void => listener(value);
	ipcRenderer.on(channel, wrapped);
	return (): void => {
		ipcRenderer.removeListener(channel, wrapped);
	};
}

const api: MiniDiaryApi = {
	app: {
		bootstrap: () => ipcRenderer.invoke(IPC.app.bootstrap),
		closeReady: (error) => ipcRenderer.send(IPC.app.closeReady, error),
		toggleWindowSize: (): Promise<void> => ipcRenderer.invoke(IPC.app.toggleWindowSize),
		openExternal: (url: string): Promise<boolean> => ipcRenderer.invoke(IPC.app.openExternal, url),
	},
	dialogs: {
		importConflict: (dates, added) => ipcRenderer.invoke(IPC.dialogs.importConflict, dates, added),
		confirmReset: (title, message, confirm, cancel) =>
			ipcRenderer.invoke(IPC.dialogs.confirmReset, title, message, confirm, cancel),
		exportFile: (defaultName, buttonLabel, content) =>
			ipcRenderer.invoke(IPC.dialogs.exportFile, defaultName, buttonLabel, content),
		exportPdf: (defaultName, buttonLabel, markdown) =>
			ipcRenderer.invoke(IPC.dialogs.exportPdf, defaultName, buttonLabel, markdown),
		importFile: (extension) => ipcRenderer.invoke(IPC.dialogs.importFile, extension),
		importImage: () => ipcRenderer.invoke(IPC.dialogs.importImage),
		selectDirectory: (buttonLabel) => ipcRenderer.invoke(IPC.dialogs.selectDirectory, buttonLabel),
		showError: (title, message) => ipcRenderer.invoke(IPC.dialogs.showError, title, message),
	},
	diary: {
		listBackups: () => ipcRenderer.invoke(IPC.diary.listBackups),
		restoreBackup: (name, password) => ipcRenderer.invoke(IPC.diary.restoreBackup, name, password),
		create: (password) => ipcRenderer.invoke(IPC.diary.create, password),
		fileExists: () => ipcRenderer.invoke(IPC.diary.fileExists),
		getPath: () => ipcRenderer.invoke(IPC.diary.getPath),
		lock: () => ipcRenderer.invoke(IPC.diary.lock),
		move: (directory) => ipcRenderer.invoke(IPC.diary.move, directory),
		read: (password) => ipcRenderer.invoke(IPC.diary.read, password),
		reset: () => ipcRenderer.invoke(IPC.diary.reset),
		save: (update) => ipcRenderer.invoke(IPC.diary.save, update),
		replaceEntries: (entries) => ipcRenderer.invoke(IPC.diary.replaceEntries, entries),
		setDirectory: (directory) => ipcRenderer.invoke(IPC.diary.setDirectory, directory),
		updatePassword: (password, entries) =>
			ipcRenderer.invoke(IPC.diary.updatePassword, password, entries),
	},
	events: {
		onPrepareClose: (listener) => subscribe(IPC.app.prepareClose, listener),
		onMenu: (listener) => {
			const channels: MenuEvent[] = [
				"nextDay",
				"previousDay",
				"goToToday",
				"nextMonth",
				"previousMonth",
				"exportJsonMiniDiary",
				"exportMd",
				"exportPdf",
				"exportTxtDayOne",
				"importJsonDayOne",
				"importJsonJrnl",
				"importJsonMiniDiary",
				"importMdMiniDiary",
				"importMdSingle",
				"importTxtDayOne",
				"lock",
				"openOverlay",
			];
			const subscriptions = channels.map((channel) =>
				subscribe<OverlayType | undefined>(channel, (overlay): void => listener(channel, overlay)),
			);
			return (): void => subscriptions.forEach((unsubscribe) => unsubscribe());
		},
		onThemeChange: (listener) => subscribe("theme-change", listener),
	},
	preferences: {
		set: (key, value) => ipcRenderer.invoke(IPC.preferences.set, key, value),
	},
};

contextBridge.exposeInMainWorld("miniDiary", api);
