import moment from "moment-timezone";
import mergeEntries from "../src/renderer/files/import/mergeEntries";
import { calculateDiaryStats, countEntryWords } from "../src/renderer/utils/diaryStats";

test("retains later content when merging empty fields", () => {
	expect(
		mergeEntries(
			{ title: "", text: "", dateUpdated: "old" },
			{ title: "New", text: "Body", dateUpdated: "new" },
		),
	).toMatchObject({ title: "New", text: "Body", dateUpdated: "new" });
});

test("counts the final streak and excludes future entries from streaks", () => {
	const entry = { title: "", text: "Hello", dateUpdated: "now" };
	const stats = calculateDiaryStats(
		{ "2026-09-15": entry, "2026-09-16": entry, "2026-09-17": entry, "2026-09-20": entry },
		moment("2026-09-17"),
	);
	expect(stats.longestStreak).toBe(3);
	expect(stats.currentStreak).toBe(3);
	expect(calculateDiaryStats({}, moment("2026-09-17")).longestStreak).toBe(0);
	expect(countEntryWords("", "Hello **world** ![image](data:image/png;base64,AAAA)")).toBe(2);
});
