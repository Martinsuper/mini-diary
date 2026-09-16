import { expect, test } from "@playwright/test";
import { _electron as electron, ElectronApplication, Page } from "playwright";
import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";

const password = "ui-test-password";
let app: ElectronApplication;
let page: Page;
let userDataDirectory: string;

const markdown = [
	"# Heading one",
	"",
	"## Heading two",
	"",
	"### Heading three",
	"",
	"**bold** *italic* ~~struck~~ `inline code`",
	"",
	"> quoted memory",
	"",
	"- bullet item",
	"",
	"1. numbered item",
	"",
	"- [ ] open task",
	"- [x] finished task",
	"",
	"[Dayleaf](https://github.com/Martinsuper/Dayleaf)",
	"",
	"---",
	"",
	"```js",
	"const answer = 42;",
	"```",
].join("\n");

test.beforeAll(async (): Promise<void> => {
	userDataDirectory = await mkdtemp(path.join(os.tmpdir(), "mini-diary-markdown-syntax-"));
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

test("renders every supported Markdown syntax", async (): Promise<void> => {
	await page.locator(".editor-mode-switch button").nth(1).click();
	await page.locator(".markdown-source").fill(markdown);
	await page.locator(".editor-mode-switch button").first().click();

	const editor = page.locator(".lexical-content-editable");
	await expect(editor.locator("h1")).toHaveText("Heading one");
	await expect(editor.locator("h2")).toHaveText("Heading two");
	await expect(editor.locator("h3")).toHaveText("Heading three");
	await expect(editor.locator("strong")).toHaveText("bold");
	await expect(editor.locator("em")).toHaveText("italic");
	const strikethrough = editor.locator("span").filter({ hasText: "struck" });
	await expect(strikethrough).toHaveText("struck");
	await expect(strikethrough).toHaveCSS("text-decoration-line", "line-through");
	await expect(editor.locator("code").filter({ hasText: "inline code" })).toBeVisible();
	await expect(editor.locator("blockquote")).toContainText("quoted memory");
	await expect(editor.locator("ul").first()).toContainText("bullet item");
	await expect(editor.locator("ol")).toContainText("numbered item");
	await expect(editor.getByRole("checkbox")).toHaveCount(2);
	await expect(editor.getByRole("checkbox").nth(0)).not.toBeChecked();
	await expect(editor.getByRole("checkbox").nth(1)).toBeChecked();
	await expect(editor.locator('a[href="https://github.com/Martinsuper/Dayleaf"]')).toHaveText(
		"Dayleaf",
	);
	await expect(editor.locator("hr")).toHaveCount(1);
	await expect(editor.locator(".lexical-code-block")).toContainText("const answer = 42;");

	await page.locator(".editor-mode-switch button").nth(1).click();
	await expect(page.locator(".markdown-source")).toHaveValue(markdown);
});
