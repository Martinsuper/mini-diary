import { Entries } from "../../types";
import { fromIndexDate, toLocaleWeekday } from "../../utils/dateFormat";
import { escapeMarkdownText } from "../../utils/markdown";
import sortEntries from "./sortEntries";

export function convertToMd(entries: Entries): Promise<string> {
	const content = ["# Mini Diary\n\n"];

	sortEntries(entries).forEach(([indexDate, entry], index): void => {
		const { text, title } = entry;
		content.push(`## ${indexDate} · ${toLocaleWeekday(fromIndexDate(indexDate))}\n\n`);
		if (title) content.push(`# ${escapeMarkdownText(title)}\n\n`);
		if (text) content.push(`${text.trim()}\n\n`);
		if (index < Object.keys(entries).length - 1) content.push("---\n\n");
	});

	return Promise.resolve(content.join(""));
}
