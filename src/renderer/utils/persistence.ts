// A single barrier for editor drafts and acknowledged disk writes.
import { useSyncExternalStore } from "react";

export type SaveState = "saved" | "dirty" | "saving" | "error";
let state: SaveState = "saved";
let error = "";
const listeners = new Set<() => void>();
const editors = new Set<() => void>();
const pending = new Set<Promise<void>>();
const retries = new Map<string, () => Promise<void>>();
const versions = new Map<string, number>();
function publish(next: SaveState): void {
	state = next;
	listeners.forEach((listener) => listener());
}
export function markDirty(): void {
	publish("dirty");
}
export function settleDraft(): void {
	if (!pending.size) publish(retries.size ? "error" : "saved");
}
export function registerDraft(flush: () => void): () => void {
	editors.add(flush);
	return () => {
		flush();
		editors.delete(flush);
	};
}
export function persist(key: string, write: () => Promise<void>): void {
	const version = (versions.get(key) || 0) + 1;
	versions.set(key, version);
	retries.set(key, write);
	publish("saving");
	const task = write()
		.then(() => {
			if (versions.get(key) === version) retries.delete(key);
		})
		.catch((reason: Error) => {
			error = reason.message;
		})
		.finally(() => {
			pending.delete(task);
			if (!pending.size) {
				if (retries.size) publish("error");
				else if (state !== "dirty") publish("saved");
			}
		});
	pending.add(task);
}
export async function flushPersistence(): Promise<void> {
	editors.forEach((flush) => flush());
	while (pending.size) await Promise.all([...pending]);
	if (retries.size) throw Error(error || "Save failed");
	publish("saved");
}
export async function retryPersistence(): Promise<void> {
	[...retries].forEach(([key, write]) => persist(key, write));
	await flushPersistence();
}
export function useSaveState(): SaveState {
	return useSyncExternalStore(
		(listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		() => state,
	);
}
