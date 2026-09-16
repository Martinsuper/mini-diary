import { BrowserWindow, shell } from "electron";

let window: BrowserWindow; // Prevent window from being garbage collected

export function getWindow(): BrowserWindow {
	return window;
}

export function setWindow(w: BrowserWindow): void {
	window = w;
	if (!w) return;
	const openSafeUrl = (url: string): void => {
		try {
			const { protocol } = new URL(url);
			if (["http:", "https:", "mailto:"].includes(protocol)) void shell.openExternal(url);
		} catch (_) {
			/* Ignore invalid and unsafe URLs. */
		}
	};
	w.webContents.setWindowOpenHandler(({ url }) => {
		openSafeUrl(url);
		return { action: "deny" };
	});
	w.webContents.on("will-navigate", (event, url) => {
		if (url === w.webContents.getURL()) return;
		event.preventDefault();
		openSafeUrl(url);
	});
}
