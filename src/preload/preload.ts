import { contextBridge, ipcRenderer } from "electron";

import { IPC, MiniDiaryApi, RendererEvent } from "../shared/ipc";

const api: MiniDiaryApi = {
	app: {
		getInfo: () => ipcRenderer.invoke(IPC.app.getInfo),
		getTranslations: () => ipcRenderer.invoke(IPC.app.getTranslations),
		on: (event: RendererEvent, listener: () => void): (() => void) => {
			const wrapped = (): void => listener();
			ipcRenderer.on(event, wrapped);
			return (): void => ipcRenderer.removeListener(event, wrapped);
		},
		toggleWindowSize: () => ipcRenderer.invoke(IPC.app.toggleWindowSize),
	},
	diary: {
		create: password => ipcRenderer.invoke(IPC.diary.create, password),
		fileExists: () => ipcRenderer.invoke(IPC.diary.fileExists),
		lock: () => ipcRenderer.invoke(IPC.diary.lock),
		read: password => ipcRenderer.invoke(IPC.diary.read, password),
		reset: () => ipcRenderer.invoke(IPC.diary.reset),
		save: entries => ipcRenderer.invoke(IPC.diary.save, entries),
		updatePassword: (password, entries) => ipcRenderer.invoke(IPC.diary.updatePassword, password, entries),
	},
	dialog: {
		confirmReset: () => ipcRenderer.invoke(IPC.dialog.confirmReset),
		selectDirectory: () => ipcRenderer.invoke(IPC.dialog.selectDirectory),
		selectExportPath: extension => ipcRenderer.invoke(IPC.dialog.selectExportPath, extension),
		selectImportFile: extensions => ipcRenderer.invoke(IPC.dialog.selectImportFile, extensions),
		showError: (title, message) => ipcRenderer.invoke(IPC.dialog.showError, title, message),
	},
	files: {
		moveDiary: directory => ipcRenderer.invoke(IPC.files.moveDiary, directory),
		readText: filePath => ipcRenderer.invoke(IPC.files.readText, filePath),
		writeExport: (filePath, content) => ipcRenderer.invoke(IPC.files.writeExport, filePath, content),
	},
	preferences: {
		get: () => ipcRenderer.invoke(IPC.preferences.get),
		set: (key, value) => ipcRenderer.invoke(IPC.preferences.set, key, value),
	},
};

contextBridge.exposeInMainWorld("miniDiary", api);
