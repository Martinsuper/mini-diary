import countWords from "word-count";
import moment from "moment-timezone";
import MarkdownIt from "markdown-it";
import { Entries } from "../types";

const parser = new MarkdownIt();

/** Count visible text, excluding image payloads, link destinations and Markdown punctuation. */
export function countEntryWords(title: string, markdown: string): number {
	const text = parser
		.parse(markdown, {})
		.flatMap((token) => {
			if (token.type === "fence" || token.type === "code_block") return [token.content];
			return (token.children || [])
				.filter((child) => ["text", "code_inline"].includes(child.type))
				.map((child) => child.content);
		})
		.join(" ");
	return countWords(`${title}\n${text}`);
}

/** Calculate streaks through today; future entries count toward totals but not streaks. */
export function calculateDiaryStats(entries: Entries, now = moment()) {
	const dates = Object.keys(entries).sort();
	const elapsed = dates.filter((date) => moment(date, "YYYY-MM-DD").isSameOrBefore(now, "day"));
	let streak = 0;
	let longestStreak = 0;
	let previous: moment.Moment | undefined;
	for (const date of elapsed) {
		const current = moment(date, "YYYY-MM-DD");
		streak = previous && current.diff(previous, "days") === 1 ? streak + 1 : 1;
		longestStreak = Math.max(longestStreak, streak);
		previous = current;
	}
	const currentStreak =
		previous && now.clone().startOf("day").diff(previous, "days") <= 1 ? streak : 0;
	const nrWords = Object.values(entries).reduce(
		(sum, entry) => sum + countEntryWords(entry.title, entry.text),
		0,
	);
	const weeks = elapsed.length
		? Math.max(1, now.diff(moment(elapsed[0], "YYYY-MM-DD"), "weeks") + 1)
		: 1;
	return {
		nrEntries: dates.length,
		avgEntriesPerWeek: elapsed.length / weeks,
		longestStreak,
		currentStreak,
		nrWords,
		avgWordsPerEntry: dates.length ? nrWords / dates.length : 0,
	};
}
