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
	userDataDirectory = await mkdtemp(path.join(os.tmpdir(), "mini-diary-title-"));
	app = await electron.launch({
		args: ["."],
		env: {
			...process.env,
			ELECTRON_USER_DATA_DIR: userDataDirectory,
			LANG: "en_US.UTF-8",
			TZ: "UTC",
		},
	});
	page = await app.firstWindow();
	const passwords = page.locator('input[type="password"]');
	await passwords.nth(0).fill(password);
	await passwords.nth(1).fill(password);
	await page.locator(".password-creation-form button").click();
	await expect(page.locator(".editor-title-input")).toBeVisible();
});

test.afterAll(async (): Promise<void> => {
	if (app) await app.close();
	if (userDataDirectory) await rm(userDataDirectory, { force: true, recursive: true });
});

test("persists a title typed into an empty entry without placeholder text", async (): Promise<void> => {
	const title = page.locator(".editor-title-input");
	await title.click();
	await page.keyboard.type("My automated title");
	await title.blur();
	await page.waitForTimeout(600);

	expect(await title.textContent()).toBe("My automated title");
	expect(await title.textContent()).not.toContain("Add a title");

	await page.locator(".calendar-nav button").first().click();
	await page.locator(".calendar-nav button").nth(1).click();
	await expect(title).toHaveText("My automated title");
});
