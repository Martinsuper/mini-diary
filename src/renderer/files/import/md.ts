import { DiaryEntry, Entries } from "../../types";
import { createDate, parseDate, toIndexDate } from "../../utils/dateFormat";

function unescapeMarkdownText(text: string): string {
	return text.replace(/\\([\\`*_[\]<>#])/g, "$1");
}

const ENTRY_HEADING = /^##\s+(\d{4}-\d{2}-\d{2})(?:\s+·.*)?\s*$/gm;

export function parseSingleEntryMd(markdown: string, indexDate: string): Entries {
	let body = markdown.trim();
	let title = "";
	const titleMatch = body.match(/^#\s+(.+)\n+/);
	if (titleMatch) {
		title = unescapeMarkdownText(titleMatch[1].trim());
		body = body.slice(titleMatch[0].length).trim();
	}
	return {
		[indexDate]: {
			dateUpdated: createDate().toString(),
			title,
			text: body,
			textFormat: "markdown",
			textFormatVersion: 1,
		},
	};
}

export function parseMiniDiaryMd(markdown: string): Entries {
	const matches = Array.from(markdown.matchAll(ENTRY_HEADING));
	if (matches.length === 0) throw Error("No Dayleaf date headings were found");
	const entries: Entries = {};
	const now = createDate().toString();

	matches.forEach((match, index): void => {
		const date = parseDate(match[1], "YYYY-MM-DD");
		if (!date.isValid()) throw Error(`Invalid date: "${match[1]}"`);
		const start = (match.index || 0) + match[0].length;
		const end =
			index + 1 < matches.length ? matches[index + 1].index || markdown.length : markdown.length;
		let body = markdown
			.slice(start, end)
			.trim()
			.replace(/\n---\s*$/, "")
			.trim();
		let title = "";
		const titleMatch = body.match(/^#\s+(.+)\n+/);
		if (titleMatch) {
			title = unescapeMarkdownText(titleMatch[1].trim());
			body = body.slice(titleMatch[0].length).trim();
		}
		const entry: DiaryEntry = {
			dateUpdated: now,
			title,
			text: body,
			textFormat: "markdown",
			textFormatVersion: 1,
		};
		entries[toIndexDate(date)] = entry;
	});
	return entries;
}
