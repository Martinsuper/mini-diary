import fs, { mkdtemp, readFile, rm, mkdir } from "fs/promises";
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

test("failed replacement leaves the previous session and disk intact", async () => {
	const diary = new DiaryService();
	await diary.create(password);
	await diary.save({
		indexDate: "2026-09-17",
		entry: { title: "old", text: "saved", dateUpdated: "now" },
	});
	const rename = jest.spyOn(fs, "rename").mockRejectedValueOnce(Error("disk failure"));
	await expect(diary.replaceEntries({})).rejects.toThrow("disk failure");
	rename.mockRestore();
	await diary.lock();
	expect((await diary.read(password)).entries["2026-09-17"].text).toBe("saved");
});

test("encrypted recovery rejects wrong passwords and restores valid snapshots", async () => {
	const diary = new DiaryService();
	await diary.create(password);
	await diary.save({
		indexDate: "2026-09-17",
		entry: { title: "private", text: "secret", dateUpdated: "now" },
	});
	await diary.replaceEntries({});
	const snapshot = (await diary.listBackups())[0];
	expect(await readFile(path.join(directory, ".dayleaf-backups", snapshot), "utf8")).not.toContain(
		"secret",
	);
	await expect(diary.restoreBackup(snapshot, "wrong")).rejects.toThrow();
	expect((await diary.restoreBackup(snapshot, password)).entries["2026-09-17"].text).toBe("secret");
});

test("moves a diary without overwriting an existing destination", async () => {
	const diary = new DiaryService();
	await diary.create(password);
	const target = path.join(directory, "moved");
	await mkdir(target);
	await diary.moveTo(target);
	expect(await new DiaryService(target).fileExists()).toBe(true);
	await expect(diary.moveTo(target)).rejects.toThrow("already exists");
});
