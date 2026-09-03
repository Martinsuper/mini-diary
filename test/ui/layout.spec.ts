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
	userDataDirectory = await mkdtemp(path.join(os.tmpdir(), "mini-diary-ui-"));
	app = await electron.launch({
		args: ["."],
		env: { ...process.env, ELECTRON_USER_DATA_DIR: userDataDirectory, LANG: "en_US.UTF-8", TZ: "UTC" },
	});
	page = await app.firstWindow();
	const passwords = page.locator('input[type="password"]');
	await passwords.nth(0).fill(password);
	await passwords.nth(1).fill(password);
	await page.locator(".password-creation-form button").click();
	await expect(page.locator(".app-titlebar")).toBeVisible();
});

test.afterAll(async (): Promise<void> => {
	if (app) await app.close();
	if (userDataDirectory) await rm(userDataDirectory, { force: true, recursive: true });
});

async function box(selector: string): Promise<{ height: number; width: number; x: number; y: number }> {
	const value = await page.locator(selector).boundingBox();
	if (!value) throw Error(`Element not found: ${selector}`);
	return value;
}

test("keeps header and search icons fully visible", async (): Promise<void> => {
	const searchWrapper = await box(".search-input-wrapper");
	const searchIcon = await box(".search-input-icon");
	const settingsButton = await box(".app-icon-button");
	const settingsIcon = await box(".app-icon-button svg");

	expect(searchIcon.x).toBeGreaterThanOrEqual(searchWrapper.x);
	expect(searchIcon.y).toBeGreaterThanOrEqual(searchWrapper.y);
	expect(searchIcon.x + searchIcon.width).toBeLessThanOrEqual(searchWrapper.x + searchWrapper.width);
	expect(searchIcon.y + searchIcon.height).toBeLessThanOrEqual(searchWrapper.y + searchWrapper.height);
	expect(settingsIcon.x).toBeGreaterThanOrEqual(settingsButton.x);
	expect(settingsIcon.y).toBeGreaterThanOrEqual(settingsButton.y);
	expect(settingsIcon.x + settingsIcon.width).toBeLessThanOrEqual(settingsButton.x + settingsButton.width);
	expect(settingsIcon.y + settingsIcon.height).toBeLessThanOrEqual(settingsButton.y + settingsButton.height);
	await expect(page.locator(".search-input-wrapper")).toHaveScreenshot("search-input.png");
	await expect(page.locator(".app-icon-button")).toHaveScreenshot("settings-button.png");
});

test("matches the diary layout visual baseline", async (): Promise<void> => {
	await expect(page).toHaveScreenshot("diary-layout.png");
});

test("aligns formatting controls to a uniform grid", async (): Promise<void> => {
	const buttons = page.locator(".formatting-buttons .button");
	const icons = page.locator(".formatting-buttons svg");
	const buttonBoxes = await Promise.all((await buttons.all()).map(button => button.boundingBox()));
	const iconBoxes = await Promise.all((await icons.all()).map(icon => icon.boundingBox()));

	expect(buttonBoxes).toHaveLength(4);
	expect(iconBoxes).toHaveLength(4);
	for (const button of buttonBoxes) {
		expect(button).not.toBeNull();
		expect(button?.width).toBe(40);
		expect(button?.height).toBe(40);
	}
	for (const icon of iconBoxes) {
		expect(icon).not.toBeNull();
		expect(icon?.width).toBe(20);
		expect(icon?.height).toBe(20);
	}
	await expect(page.locator(".formatting-buttons")).toHaveScreenshot("formatting-buttons.png");
});
