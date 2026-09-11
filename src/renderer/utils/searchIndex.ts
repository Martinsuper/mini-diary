import debounce from "lodash.debounce";
import MiniSearch, { SearchResult } from "minisearch";

import { DiaryEntry, Entries, IndexDate } from "../types";
import mdToTxt from "./mdToTxt";

interface IndexDoc {
	indexDate: string;
	title: string;
	text: string;
}

interface DebouncedIndexUpdate {
	(entryOld: DiaryEntry, entryUpdated: DiaryEntry): void;
	cancel(): void;
	flush(): void;
}

const BATCH_SIZE = 25;
const INDEX_UPDATE_DELAY = 1000;
const MAX_RESULTS = 100;

let index: MiniSearch | null = null;
const documents = new Map<IndexDate, IndexDoc>();
let updates = Promise.resolve();

const SPACE_OR_PUNCTUATION = /[^\p{L}\p{N}@#]+/u;

async function createIndexDoc(indexDate: string, entry: DiaryEntry): Promise<IndexDoc> {
	return { indexDate, text: await mdToTxt(entry.text), title: entry.title };
}

function createSearchIndex(): MiniSearch {
	return new MiniSearch({
		fields: ["title", "text"],
		idField: "indexDate",
		tokenize: (str: string): string[] => str.split(SPACE_OR_PUNCTUATION),
	});
}

function yieldToBrowser(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

function enqueueUpdate(update: () => Promise<void>): Promise<void> {
	updates = updates.catch(() => undefined).then(update);
	return updates;
}

export function createIndex(entries: Entries): Promise<void> {
	return enqueueUpdate(async (): Promise<void> => {
		const nextIndex = createSearchIndex();
		const nextDocuments = new Map<IndexDate, IndexDoc>();
		const entryList = Object.entries(entries);

		for (let start = 0; start < entryList.length; start += BATCH_SIZE) {
			const batch = entryList.slice(start, start + BATCH_SIZE);
			const docs = await Promise.all(
				batch.map(([indexDate, entry]) => createIndexDoc(indexDate, entry)),
			);
			docs.forEach((doc) => nextDocuments.set(doc.indexDate, doc));
			nextIndex.addAll(docs);
			if (start + BATCH_SIZE < entryList.length) await yieldToBrowser();
		}

		index = nextIndex;
		documents.clear();
		nextDocuments.forEach((doc, indexDate) => documents.set(indexDate, doc));
	});
}

export function addIndexDoc(indexDate: IndexDate, entry: DiaryEntry): Promise<void> {
	return enqueueUpdate(async (): Promise<void> => {
		if (!index) return;
		const doc = await createIndexDoc(indexDate, entry);
		index.add(doc);
		documents.set(indexDate, doc);
	});
}

export function removeIndexDoc(indexDate: IndexDate): Promise<void> {
	return enqueueUpdate(async (): Promise<void> => {
		const doc = documents.get(indexDate);
		if (!index || !doc) return;
		index.remove(doc);
		documents.delete(indexDate);
	});
}

export function updateIndexDoc(
	indexDate: IndexDate,
	entryOld: DiaryEntry,
	entryUpdated: DiaryEntry,
): Promise<void> {
	return enqueueUpdate(async (): Promise<void> => {
		if (!index) return;
		const oldDoc = documents.get(indexDate) || (await createIndexDoc(indexDate, entryOld));
		const newDoc = await createIndexDoc(indexDate, entryUpdated);
		index.remove(oldDoc);
		index.add(newDoc);
		documents.set(indexDate, newDoc);
	});
}

const pendingIndexUpdates = new Map<IndexDate, DebouncedIndexUpdate>();

export function scheduleIndexUpdate(
	indexDate: IndexDate,
	entryOld: DiaryEntry,
	entryUpdated: DiaryEntry,
): void {
	let update = pendingIndexUpdates.get(indexDate);
	if (!update) {
		update = debounce((oldEntry: DiaryEntry, newEntry: DiaryEntry): void => {
			pendingIndexUpdates.delete(indexDate);
			void updateIndexDoc(indexDate, oldEntry, newEntry);
		}, INDEX_UPDATE_DELAY);
		pendingIndexUpdates.set(indexDate, update);
	}
	update(entryOld, entryUpdated);
}

export function cancelIndexUpdate(indexDate: IndexDate): void {
	const update = pendingIndexUpdates.get(indexDate);
	if (!update) return;
	update.cancel();
	pendingIndexUpdates.delete(indexDate);
}

export function flushIndexUpdates(): void {
	pendingIndexUpdates.forEach((update) => update.flush());
}

export function cancelIndexUpdates(): void {
	pendingIndexUpdates.forEach((update) => update.cancel());
	pendingIndexUpdates.clear();
}

export function searchIndex(key: string): string[] {
	if (!index || !key) return [];
	return index
		.search(key, { prefix: true })
		.map((searchResult: SearchResult): string => searchResult.id)
		.sort()
		.reverse()
		.slice(0, MAX_RESULTS);
}
