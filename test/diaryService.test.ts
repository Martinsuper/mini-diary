import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";

import { app } from "electron";

import DiaryService from "../src/main/services/diaryService";

const password = "test-password";
let directory: string;

beforeEach(async (): Promise<void> => {
	directory = await mkdtemp(path.join(os.tmpdir(), "mini-diary-service-"));
	jest.spyOn(app, "getPath").mockReturnValue(directory);
	jest.spyOn(app, "getVersion").mockReturnValue("0.0.0-test");
	Object.defineProperty(app, "name", { configurable: true, value: "Dayleaf" });
});

afterEach(async (): Promise<void> => {
	jest.restoreAllMocks();
	await rm(directory, { force: true, recursive: true });
});

test("persists the newest queued entry update", async (): Promise<void> => {
	const diary = new DiaryService();
	await diary.create(password);
	diary.save({
		entry: { dateUpdated: "first", text: "first", title: "First" },
		indexDate: "2026/09/03",
	});
	diary.save({
		entry: { dateUpdated: "second", text: "second", title: "Second" },
		indexDate: "2026/09/03",
	});
	await diary.flush();

	const reopened = new DiaryService();
	await expect(reopened.read(password)).resolves.toMatchObject({
		entries: { "2026/09/03": { dateUpdated: "second", text: "second", title: "Second" } },
	});
});

test("rejects an incorrect password without altering the encrypted file", async (): Promise<void> => {
	const diary = new DiaryService();
	await diary.create(password);
	diary.save({
		entry: { dateUpdated: "now", text: "secret", title: "Private" },
		indexDate: "2026/09/03",
	});
	await diary.flush();
	const stored = await readFile(path.join(directory, "mini-diary.txt"), "utf8");

	const reopened = new DiaryService();
	await expect(reopened.read("incorrect-password")).rejects.toThrow();
	await expect(readFile(path.join(directory, "mini-diary.txt"), "utf8")).resolves.toBe(stored);
});

test("flushes pending changes before locking", async (): Promise<void> => {
	const diary = new DiaryService();
	await diary.create(password);
	diary.save({
		entry: { dateUpdated: "now", text: "saved", title: "Saved" },
		indexDate: "2026/09/03",
	});
	await diary.lock();
	await expect(diary.flush()).resolves.toBeUndefined();

	const reopened = new DiaryService();
	await expect(reopened.read(password)).resolves.toMatchObject({
		entries: { "2026/09/03": { text: "saved", title: "Saved" } },
	});
});
