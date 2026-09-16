import { expect, test } from "@playwright/test";
import { _electron as electron, ElectronApplication, Page } from "playwright";
import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";

let app: ElectronApplication;
let child: ReturnType<ElectronApplication["process"]>;
let page: Page;
let directory: string;
const password = "reliability-password";
async function launch(): Promise<void> {
	app = await electron.launch({
		args: ["."],
		env: {
			...process.env,
			ELECTRON_USER_DATA_DIR: directory,
			MINI_DIARY_TEST_LOCALE: "zh-CN",
		},
	});
	child = app.process();
	page = await app.firstWindow();
}
test.beforeEach(async () => {
	directory = await mkdtemp(path.join(os.tmpdir(), "mini-diary-reliability-"));
	await launch();
	await page.locator('input[type="password"]').nth(0).fill(password);
	await page.locator('input[type="password"]').nth(1).fill(password);
	await page.locator(".password-creation-form button").click();
	await expect(page.locator(".editor")).toBeVisible();
});
test.afterEach(async () => {
	if (child && child.exitCode === null && child.signalCode === null) {
		child.kill("SIGKILL");
		await new Promise<void>((resolve) => child.once("exit", () => resolve()));
	}
	await rm(directory, { recursive: true, force: true });
});

test("new diaries support Chinese substring search and snippets", async () => {
	await page.locator(".lexical-content-editable").fill("今天去了公园散步");
	await expect(page.locator(".sidebar-save-state")).toHaveClass(/save-saved/);
	await page.locator(".search-input").fill("公园");
	await expect(page.locator(".search-result")).toHaveCount(1);
	await expect(page.locator(".search-summary mark")).toHaveText("公园");
});

test("settings trap focus, dismiss with Escape and restore the trigger", async () => {
	await page.locator(".app-icon-button").click();
	await expect(page.locator('.overlay-inner[role="dialog"]')).toBeVisible();
	for (let i = 0; i < 20; i += 1) {
		await page.keyboard.press("Tab");
		expect(
			await page.evaluate(() => Boolean(document.activeElement?.closest(".overlay-inner"))),
		).toBe(true);
	}
	await page.keyboard.press("Escape");
	await expect(page.locator(".overlay-inner")).toHaveCount(0);
	await expect(page.locator(".app-icon-button")).toBeFocused();
});

test("advanced Markdown explicitly offers source editing", async () => {
	await page.locator(".editor-mode-switch button").last().click();
	await page.locator(".markdown-source").fill("| A | B |\n| --- | --- |\n| 1 | 2 |");
	await page.locator(".editor-mode-switch button").first().click();
	await expect(page.locator(".markdown-extended-preview table")).toBeVisible();
	await expect(page.locator(".formatting-buttons")).toHaveCount(0);
	await page.locator(".markdown-warning button").click();
	await expect(page.locator(".markdown-source")).toBeVisible();
});

test("link dialog validates URLs and applies a link to the selection", async () => {
	const editor = page.locator(".lexical-content-editable");
	await editor.fill("Example");
	await page.keyboard.press("ControlOrMeta+A");
	await page.locator(".toolbar-insert-group button").first().click();
	await expect(page.locator(".link-dialog")).toBeVisible();
	// eslint-disable-next-line no-script-url
	await page.locator(".link-dialog input").fill("javascript:alert(1)");
	await page.locator('.link-dialog button[type="submit"]').click();
	await expect(page.locator("#link-error")).toBeVisible();
	await page.locator(".link-dialog input").fill("https://example.com");
	await page.locator('.link-dialog button[type="submit"]').click();
	await expect(editor.locator("a")).toHaveAttribute("href", "https://example.com");
});

test("save failures remain visible, block closing and can be retried", async () => {
	await app.evaluate(({ ipcMain, dialog }) => {
		// Test-only fault injection: preserve and restore the registered IPC handler.
		// eslint-disable-next-line no-underscore-dangle
		const handlers = (ipcMain as unknown as { _invokeHandlers: Map<string, unknown> })
			._invokeHandlers;
		const original = handlers.get("diary:save");
		(globalThis as Record<string, unknown>).restoreDiarySave = () => {
			handlers.set("diary:save", original);
		};
		handlers.set("diary:save", async () => {
			throw Error("Simulated disk failure");
		});
		Object.defineProperty(dialog, "showErrorBox", { configurable: true, value: () => undefined });
	});
	await page.locator(".lexical-content-editable").fill("失败后仍需保留");
	await expect(page.locator(".sidebar-save-state")).toHaveClass(/save-error/);
	await app.evaluate(({ BrowserWindow }) => {
		BrowserWindow.getAllWindows()[0].close();
	});
	await expect(page.locator(".editor")).toBeVisible();
	await app.evaluate(() => {
		(globalThis as unknown as { restoreDiarySave: () => void }).restoreDiarySave();
	});
	await page.locator(".sidebar-save-state button").click();
	await expect(page.locator(".sidebar-save-state")).toHaveClass(/save-saved/);
});

test("closing immediately after typing persists the final draft", async () => {
	await page.locator(".lexical-content-editable").fill("最后一笔不能丢失");
	await app.evaluate(({ BrowserWindow }) => {
		BrowserWindow.getAllWindows()[0].close();
	});
	await expect.poll(() => child.exitCode).not.toBeNull();
	await launch();
	await page.locator(".password-prompt-form input").fill(password);
	await page.locator(".password-prompt-form button").click();
	await expect(page.locator(".lexical-content-editable")).toContainText("最后一笔不能丢失");
});
