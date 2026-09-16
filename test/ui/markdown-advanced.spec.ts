import { expect, test } from "@playwright/test";
import { _electron as electron, ElectronApplication, Page } from "playwright";
import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";

const password = "ui-test-password";
let app: ElectronApplication;
let page: Page;
let userDataDirectory: string;

test.beforeAll(async (): Promise<void> => {
	userDataDirectory = await mkdtemp(path.join(os.tmpdir(), "mini-diary-markdown-advanced-"));
	app = await electron.launch({
		args: ["."],
		env: {
			...process.env,
			ELECTRON_USER_DATA_DIR: userDataDirectory,
			LANG: "en_US.UTF-8",
			MINI_DIARY_TEST_LOCALE: "en-US",
			TZ: "UTC",
		},
	});
	page = await app.firstWindow();
	const passwords = page.locator('input[type="password"]');
	await passwords.nth(0).fill(password);
	await passwords.nth(1).fill(password);
	await page.locator(".password-creation-form button").click();
	await expect(page.locator(".lexical-content-editable")).toBeVisible();
});

test.afterAll(async (): Promise<void> => {
	if (app) {
		const child = app.process();
		child?.kill("SIGKILL");
		await new Promise<void>((resolve) => {
			if (!child || child.exitCode !== null || child.signalCode !== null) resolve();
			else child.once("exit", () => resolve());
		});
	}
	if (userDataDirectory) await rm(userDataDirectory, { force: true, recursive: true });
});

test("persists Markdown after locking and unlocking", async (): Promise<void> => {
	await page.locator(".editor-mode-switch button").nth(1).click();
	await page.locator(".markdown-source").fill("# Persistent\n\nA **saved** memory.");
	await app.evaluate(({ BrowserWindow }) =>
		BrowserWindow.getAllWindows()[0].webContents.send("lock"),
	);
	await expect(page.locator('.password-prompt-form input[type="password"]')).toBeVisible();
	await page.locator('.password-prompt-form input[type="password"]').fill(password);
	await page.locator(".password-prompt-form button").click();
	await expect(page.locator(".markdown-source")).toHaveValue(/# Persistent[\s\S]*\*\*saved\*\*/);
});

test("shows help, copy actions, and the Markdown preference", async (): Promise<void> => {
	await page.locator(".markdown-help > button").click();
	await expect(page.locator(".markdown-help-popover")).toBeVisible();
	await expect(page.locator(".markdown-copy-actions button")).toHaveCount(3);
	await app.evaluate(({ BrowserWindow }) =>
		BrowserWindow.getAllWindows()[0].webContents.send("openOverlay", "preferences"),
	);
	await expect(page.locator("#enable-markdown-shortcuts")).toBeChecked();
	await page.locator("#enable-markdown-shortcuts").uncheck();
	await expect(page.locator("#enable-markdown-shortcuts")).not.toBeChecked();
});

test("imports and exports Mini Diary Markdown", async (): Promise<void> => {
	await page.keyboard.press("Escape");
	await page.locator(".markdown-source").fill("");
	await page.locator(".markdown-source").blur();
	await page.waitForTimeout(1200);
	test.setTimeout(60000);
	const importFile = path.join(userDataDirectory, "import.md");
	await import("fs/promises").then(({ writeFile }) =>
		writeFile(
			importFile,
			"# Mini Diary\n\n## 2026-09-12 · Saturday\n\n# Imported\n\nA **Markdown** import.\n",
		),
	);
	await app.evaluate(({ dialog }, filePath) => {
		Object.defineProperty(dialog, "showOpenDialog", {
			configurable: true,
			value: async () =>
				({ canceled: false, filePaths: [filePath] } as Electron.OpenDialogReturnValue),
		});
	}, importFile);
	await app.evaluate(({ BrowserWindow }) =>
		BrowserWindow.getAllWindows()[0].webContents.send("importMdMiniDiary"),
	);
	await page.locator(".import-overlay .button-main").click();
	await expect(page.locator(".import-overlay")).toHaveCount(0);
	await expect(page.locator('[role="grid"]')).toBeVisible();
	const importedDateButton = page.getByRole("button", { name: /Saturday, September 12th, 2026/ });
	await expect(importedDateButton).toBeEnabled();
	await importedDateButton.click();
	await expect(page.locator(".markdown-source")).toHaveValue(/Markdown.*import/);
	await page.locator(".editor-mode-switch button").first().click();
	await expect(page.locator(".editor-title-input")).toHaveText("Imported");

	const exportFile = path.join(userDataDirectory, "export.md");
	await app.evaluate(({ dialog }, filePath) => {
		Object.defineProperty(dialog, "showSaveDialog", {
			configurable: true,
			value: async () => ({ canceled: false, filePath } as Electron.SaveDialogReturnValue),
		});
	}, exportFile);
	await app.evaluate(({ BrowserWindow }) =>
		BrowserWindow.getAllWindows()[0].webContents.send("exportMd"),
	);
	await expect
		.poll(async () => readFile(exportFile, "utf8").catch(() => ""))
		.toContain("A **Markdown** import.");
});
