import { Entries, MiniDiaryJson } from "../../types";
import { createDate } from "../../utils/dateFormat";
import sortEntries from "./sortEntries";

/**
 * Convert entries to a Mini Diary JSON string
 */
export function convertToMiniDiaryJson(entries: Entries): Promise<string> {
	return new Promise(resolve => {
		const entriesSorted = sortEntries(entries);
		const entriesJson: Entries = {};

		// Convert sorted array back to object
		entriesSorted.forEach(([indexDate, entry]) => {
			entriesJson[indexDate] = entry;
		});

		// Add metadata
		const content: MiniDiaryJson = {
			metadata: {
				application: "Mini Diary",
				version: "v0.0.0",
				dateUpdated: createDate().toString(),
			},
			entries: entriesJson,
		};
		resolve(`${JSON.stringify(content, null, "\t")}\n`);
	});
}
