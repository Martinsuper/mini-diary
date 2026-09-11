import "./assets/styles/styles.scss";

import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { initLogger } from "../shared/logger";
import { initializeBootstrap } from "./bootstrap";

async function start(): Promise<void> {
	initializeBootstrap(await window.miniDiary.app.bootstrap());
	const [
		{ default: AppContainer },
		{ default: initIpcListeners },
		{ default: store },
		{ initI18n },
	] = await Promise.all([
		import("./components/AppContainer"),
		import("./electron/ipcRenderer/listeners"),
		import("./store/store"),
		import("./utils/i18n"),
	]);

	initLogger();
	initIpcListeners();
	initI18n();

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
