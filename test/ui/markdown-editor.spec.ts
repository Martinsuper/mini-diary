import { expect, test } from "@playwright/test";
import { _electron as electron, ElectronApplication, Page } from "playwright";
import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";

const password = "ui-test-password";
let app: ElectronApplication;
let page: Page;
let userDataDirectory: string;

test.beforeAll(async (): Promise<void> => {
	userDataDirectory = await mkdtemp(path.join(os.tmpdir(), "mini-diary-markdown-"));
	app = await electron.launch({
		args: ["."],
		env: {
			...process.env,
			ELECTRON_USER_DATA_DIR: userDataDirectory,
			LANG: "zh_CN.UTF-8",
			MINI_DIARY_TEST_LOCALE: "zh-CN",
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

test("formats Markdown shortcuts and preserves source through mode switches", async (): Promise<void> => {
	const editor = page.locator(".lexical-content-editable");
	await editor.click();
	await page.keyboard.type("## ");
	await page.keyboard.type("A Markdown day");
	await page.keyboard.press("Enter");
	await page.keyboard.type("- ");
	await page.keyboard.type("first item");

	await expect(editor.locator("h2")).toHaveText("A Markdown day");
	await expect(editor.locator("li")).toHaveText("first item");

	await page.locator(".editor-mode-switch button").nth(1).click();
	const source = page.locator(".markdown-source");
	await expect(source).toBeVisible();
	await expect(source).toHaveValue(/## A Markdown day[\s\S]*- first item/);

	await source.fill("# Edited in source\n\nA **bold** memory.");
	await page.locator(".editor-mode-switch button").first().click();
	await expect(page.locator(".lexical-content-editable h1")).toHaveText("Edited in source");
	await expect(page.locator(".lexical-content-editable strong")).toHaveText("bold");
});

test("renders fenced code as a distinct code block", async (): Promise<void> => {
	await page.locator(".editor-mode-switch button").nth(1).click();
	await page.locator(".markdown-source").fill("```bash\necho 'hello world'\n```");
	await page.locator(".editor-mode-switch button").first().click();
	const codeBlock = page.locator(".lexical-code-block");
	await expect(codeBlock).toHaveText("echo 'hello world'");
	await expect(codeBlock).toHaveCSS("display", "block");
	await expect(codeBlock).toHaveCSS("font-family", /monospace/);
});

test("uses the active Chinese locale for dates", async (): Promise<void> => {
	await expect(page.locator(".editor-scrollable > .text-faded")).toContainText("年");
});

test("toggles source mode with the keyboard shortcut", async (): Promise<void> => {
	await page.keyboard.press("ControlOrMeta+Shift+M");
	await expect(page.locator(".markdown-source")).toBeVisible();
	await page.keyboard.press("ControlOrMeta+Shift+M");
	await expect(page.locator(".lexical-content-editable")).toBeVisible();
});
