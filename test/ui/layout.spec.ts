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
		env: {
			...process.env,
			ELECTRON_USER_DATA_DIR: userDataDirectory,
			LANG: "en_US.UTF-8",
			TZ: "UTC",
		},
	});
	page = await app.firstWindow();
	page.on("pageerror", (error) => console.error(error));
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

async function box(
	selector: string,
): Promise<{ height: number; width: number; x: number; y: number }> {
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
	expect(searchIcon.x + searchIcon.width).toBeLessThanOrEqual(
		searchWrapper.x + searchWrapper.width,
	);
	expect(searchIcon.y + searchIcon.height).toBeLessThanOrEqual(
		searchWrapper.y + searchWrapper.height,
	);
	expect(settingsIcon.x).toBeGreaterThanOrEqual(settingsButton.x);
	expect(settingsIcon.y).toBeGreaterThanOrEqual(settingsButton.y);
	expect(settingsIcon.x + settingsIcon.width).toBeLessThanOrEqual(
		settingsButton.x + settingsButton.width,
	);
	expect(settingsIcon.y + settingsIcon.height).toBeLessThanOrEqual(
		settingsButton.y + settingsButton.height,
	);
	await expect(page.locator(".search-input-wrapper")).toHaveScreenshot("search-input.png");
	await expect(page.locator(".app-icon-button")).toHaveScreenshot("settings-button.png", {
		maxDiffPixels: 32,
	});
});

test("preserves the legacy sidebar and editor geometry", async (): Promise<void> => {
	const sidebar = await box(".sidebar");
	const editor = await box(".editor");
	const search = await box(".search-input-wrapper");
	const calendar = await box(".DayPicker");
	const title = await box(".editor-title-wrapper");
	const content = await box(".lexical-content-editable");
	const toolbar = await box(".editor-toolbar");
	const day = await box(".DayPicker-Day--selected .DayPicker-DayButton");
	const weekdayHeaders = await page
		.locator(".DayPicker-Weekday")
		.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().x));
	const firstWeekDays = await page
		.locator(".DayPicker-Week")
		.first()
		.locator(".DayPicker-Day")
		.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().x));
	const titleStyles = await page.locator(".editor-title-input").evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			background: style.backgroundColor,
			border: style.borderStyle,
			shadow: style.boxShadow,
		};
	});

	expect(sidebar.width).toBe(288);
	expect(editor.x).toBe(sidebar.x + sidebar.width);
	expect(search.height).toBe(40);
	expect(calendar.width).toBeLessThanOrEqual(sidebar.width - 40);
	expect(title.width).toBe(content.width);
	expect(content.y).toBeGreaterThan(title.y + title.height);
	expect(toolbar.height).toBe(50);
	expect(toolbar.y).toBe(editor.y + editor.height - toolbar.height - 24);
	expect(day.width).toBe(34);
	expect(day.height).toBe(34);
	expect(titleStyles.border).toBe("none");
	expect(titleStyles.shadow).toBe("none");
	expect(titleStyles.background).toBe("rgba(0, 0, 0, 0)");
	expect(weekdayHeaders).toHaveLength(7);
	expect(firstWeekDays).toHaveLength(7);
	weekdayHeaders.forEach((position, index) =>
		expect(position).toBeCloseTo(firstWeekDays[index], 0),
	);
	const selectedStyles = await page.locator(".DayPicker-Day--selected").evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			background: style.backgroundColor,
			shadow: style.boxShadow,
			border: style.borderStyle,
		};
	});
	expect(selectedStyles.background).toBe("rgba(0, 0, 0, 0)");
	expect(selectedStyles.shadow).toBe("none");
	expect(selectedStyles.border).toBe("none");
	await expect(page).toHaveScreenshot("diary-layout.png", { maxDiffPixels: 7_000 });
});

test("aligns formatting controls to a uniform grid", async (): Promise<void> => {
	const buttons = page.locator(".formatting-buttons .button");
	const icons = page.locator(".formatting-buttons svg");
	const buttonBoxes = await Promise.all(
		(await buttons.all()).map((button) => button.boundingBox()),
	);
	const iconBoxes = await Promise.all((await icons.all()).map((icon) => icon.boundingBox()));

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
	await expect(page.locator(".formatting-buttons")).toHaveScreenshot("formatting-buttons.png", {
		maxDiffPixels: 64,
	});
});
