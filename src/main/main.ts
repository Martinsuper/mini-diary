import { app, BrowserWindow } from "electron";
import path from "path";

import contextMenu from "electron-context-menu";

import { initLogger } from "../shared/logger";
import DiaryService from "./services/diaryService";
import { initI18n } from "./i18n/i18n";
import initIpcListeners from "./ipcMain/listeners";
import { buildMenu } from "./menu/menu";
import updateApp from "./updater";
import { getWindow, setWindow } from "./window";

if (process.env.ELECTRON_USER_DATA_DIR) {
	app.setPath("userData", process.env.ELECTRON_USER_DATA_DIR);
}

initLogger();
if (process.env.NODE_ENV !== "production") {
	void import("electron-debug").then(({ default: electronDebug }) => electronDebug());
}
const diaryService = new DiaryService();

contextMenu({
	showCopyImage: false,
	showSearchWithGoogle: false,
});

async function createWindow(): Promise<BrowserWindow> {
	const win = new BrowserWindow({
		width: 1100,
		minWidth: 500,
		height: 600,
		minHeight: 500,
		show: false,
		titleBarStyle: "hiddenInset",
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			preload: path.join(__dirname, "preload.js"),
			sandbox: true,
			spellcheck: true,
		},
	});
	win.on("ready-to-show", (): void => {
		win.show();
	});
	win.on("closed", (): void => {
		// Dereference the window
		// @ts-ignore
		setWindow(null);
	});

	// Load HTML file
	await win.loadFile(path.join(__dirname, "index.html"));

	return win;
}

// Quit app when all of its windows have been closed
app.on("window-all-closed", (): void => {
	app.quit();
});

app.on("before-quit", (event) => {
	event.preventDefault();
	void diaryService.flush().finally(() => app.exit());
});

// On app activation (e.g. when clicking dock icon), re-create BrowserWindow if necessary
app.on("activate", async (): Promise<void> => {
	if (!getWindow()) {
		setWindow(await createWindow());
	}
});

(async (): Promise<void> => {
	// Wait for Electron to be initialized
	await app.whenReady();

	// Set up translations, messaging between main and renderer processes, and application menu
	initI18n();
	buildMenu();
	initIpcListeners(diaryService);

	// Create and show BrowserWindow
	setWindow(await createWindow());

	updateApp();
})();
