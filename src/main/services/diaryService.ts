import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

import { app } from "electron";

import { DiaryPayload } from "../../shared/ipc";
import { Entries, Metadata, MiniDiaryJson } from "../../renderer/types";

const FILE_NAME = "mini-diary.txt";
const FORMAT = "mini-diary/v2";

interface EncryptedDiary {
	ciphertext: string;
	format: typeof FORMAT;
	nonce: string;
	salt: string;
	tag: string;
}

interface Session {
	key: Buffer;
	metadata: Metadata;
	salt: Buffer;
}

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject): void => {
		crypto.scrypt(password, salt, 32, (error, key): void => {
			if (error) {
				reject(error);
				return;
			}
			resolve(key as Buffer);
		});
	});
}

function isEncryptedDiary(value: unknown): value is EncryptedDiary {
	if (!value || typeof value !== "object") return false;
	const data = value as Record<string, unknown>;
	return data.format === FORMAT && ["ciphertext", "nonce", "salt", "tag"].every(key => typeof data[key] === "string");
}

function isDiaryPayload(value: unknown): value is MiniDiaryJson {
	if (!value || typeof value !== "object") return false;
	const data = value as Record<string, unknown>;
	return Boolean(data.entries && data.metadata && typeof data.entries === "object" && typeof data.metadata === "object");
}

export default class DiaryService {
	private directory: string;

	private session: Session | null = null;

	constructor() {
		this.directory = app.getPath("userData");
	}

	getDirectory(): string {
		return this.directory;
	}

	async setDirectory(directory: string): Promise<void> {
		const target = path.resolve(directory, FILE_NAME);
		try {
			await fs.access(target);
		} catch {
			this.directory = directory;
			return;
		}
		this.directory = directory;
	}

	async moveTo(directory: string): Promise<void> {
		const destination = path.resolve(directory, FILE_NAME);
		try {
			await fs.access(destination);
			throw Error("A diary file already exists in the selected directory");
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
		await fs.rename(this.filePath(), destination);
		this.directory = directory;
	}

	async fileExists(): Promise<boolean> {
		try {
			await fs.access(this.filePath());
			return true;
		} catch {
			return false;
		}
	}

	async create(password: string): Promise<DiaryPayload> {
		const salt = crypto.randomBytes(16);
		const metadata = this.metadata();
		this.session = { key: await deriveKey(password, salt), metadata, salt };
		const payload = { entries: {}, metadata };
		await this.write(payload);
		return payload;
	}

	async read(password: string): Promise<DiaryPayload> {
		const serialized = await fs.readFile(this.filePath(), "utf8");
		const encrypted = JSON.parse(serialized) as unknown;
		if (!isEncryptedDiary(encrypted)) throw Error("Unsupported diary file format");
		const salt = Buffer.from(encrypted.salt, "base64");
		const key = await deriveKey(password, salt);
		const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(encrypted.nonce, "base64"));
		decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
		const plaintext = Buffer.concat([decipher.update(Buffer.from(encrypted.ciphertext, "base64")), decipher.final()]);
		const payload = JSON.parse(plaintext.toString("utf8")) as unknown;
		if (!isDiaryPayload(payload)) throw Error("Diary file has an invalid payload");
		this.session = { key, metadata: payload.metadata, salt };
		return payload;
	}

	async save(entries: Entries): Promise<DiaryPayload> {
		const session = this.requireSession();
		const payload = { entries, metadata: { ...session.metadata, dateUpdated: new Date().toISOString() } };
		session.metadata = payload.metadata;
		await this.write(payload);
		return payload;
	}

	async updatePassword(password: string, entries: Entries): Promise<DiaryPayload> {
		const metadata = this.requireSession().metadata;
		this.lock();
		const salt = crypto.randomBytes(16);
		this.session = { key: await deriveKey(password, salt), metadata, salt };
		return this.save(entries);
	}

	lock(): void {
		if (this.session) this.session.key.fill(0);
		this.session = null;
	}

	async reset(): Promise<void> {
		this.lock();
		await fs.unlink(this.filePath());
	}

	private filePath(): string {
		return path.resolve(this.directory, FILE_NAME);
	}

	private metadata(): Metadata {
		return { application: app.name, dateUpdated: new Date().toISOString(), version: app.getVersion() };
	}

	private requireSession(): Session {
		if (!this.session) throw Error("Diary is locked");
		return this.session;
	}

	private async write(payload: DiaryPayload): Promise<void> {
		const session = this.requireSession();
		const nonce = crypto.randomBytes(12);
		const cipher = crypto.createCipheriv("aes-256-gcm", session.key, nonce);
		const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
		const serialized = JSON.stringify({
			ciphertext: ciphertext.toString("base64"),
			format: FORMAT,
			nonce: nonce.toString("base64"),
			salt: session.salt.toString("base64"),
			tag: cipher.getAuthTag().toString("base64"),
		});
		const target = this.filePath();
		const temporary = `${target}.${process.pid}.tmp`;
		await fs.mkdir(path.dirname(target), { recursive: true });
		await fs.writeFile(temporary, serialized, { encoding: "utf8", mode: 0o600 });
		await fs.rename(temporary, target);
	}
}
