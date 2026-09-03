import { Entries } from "../../types";
import { fromIndexDate, toLocaleWeekday } from "../../utils/dateFormat";
import sortEntries from "./sortEntries";

export function convertToMd(entries: Entries): Promise<string> {
	const content = ["# Mini Diary\n\n"];

	sortEntries(entries).forEach(([indexDate, entry]): void => {
		const { text, title } = entry;
		content.push(`## ${toLocaleWeekday(fromIndexDate(indexDate))}\n\n`);
		if (title) {
			content.push(`**${title}**\n\n`);
		}
		if (text) {
			content.push(`${text}\n\n`);
		}
		content.push("\n");
	});

	return Promise.resolve(content.join(""));
}
