import "./assets/styles/styles.scss";

import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { initLogger } from "../shared/logger";
import { initializeBootstrap } from "./bootstrap";

async function start(): Promise<void> {
	initializeBootstrap(await window.miniDiary.app.bootstrap());
	// Set the locale before reducers create their initial Moment instances.
	const { initI18n } = await import("./utils/i18n");
	initI18n();
	const [{ default: AppContainer }, { default: initIpcListeners }, { default: store }] =
		await Promise.all([
			import("./components/AppContainer"),
			import("./electron/ipcRenderer/listeners"),
			import("./store/store"),
		]);

	initLogger();
	initIpcListeners();

	const root = document.createElement("div");
	root.id = "root";
	document.body.appendChild(root);

	createRoot(root).render(
		<Provider store={store}>
			<AppContainer />
		</Provider>,
	);
}

void start();
