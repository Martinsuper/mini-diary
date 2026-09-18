import { DiaryEntry } from "../../types";

const INLINE_SEPARATOR = " | ";
const MULTILINE_SEPARATOR = "\n\n––––––––––\n\n";

/**
 * Merge the contents of two diary entries and split old and new text using separators
 */
export default function mergeEntries(entryOld: DiaryEntry, entryNew: DiaryEntry): DiaryEntry {
	// Add title and text to existing entry if there already is one for the same day
	const entryMerged = { ...entryOld };
	entryMerged.title = [entryOld.title, entryNew.title].filter(Boolean).join(INLINE_SEPARATOR);
	entryMerged.text = [entryOld.text, entryNew.text].filter(Boolean).join(MULTILINE_SEPARATOR);
	entryMerged.dateUpdated = entryNew.dateUpdated;
	if (entryOld.textFormat === "plain" && entryNew.textFormat === "markdown") {
		entryMerged.text = [entryOld.text.replace(/([\\`*_{}[\]()#+.!>|~-])/g, "\\$1"), entryNew.text]
			.filter(Boolean)
			.join(MULTILINE_SEPARATOR);
		entryMerged.textFormat = "markdown";
		entryMerged.textFormatVersion = 1;
	}
	if (entryOld.textFormat === "markdown" && entryNew.textFormat === "plain") {
		entryMerged.text = [entryOld.text, entryNew.text.replace(/([\\`*_{}[\]()#+.!>|~-])/g, "\\$1")]
			.filter(Boolean)
			.join(MULTILINE_SEPARATOR);
	}
	return entryMerged;
}
