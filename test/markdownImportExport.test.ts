import { convertToMd } from "../src/renderer/files/export/md";
import { parseMiniDiaryMd, parseSingleEntryMd } from "../src/renderer/files/import/md";

const entries = {
	"2025-09-12": {
		dateUpdated: "now",
		title: "A *safe* title",
		text: "## Notes\n\n- first\n- second",
		textFormat: "markdown" as const,
		textFormatVersion: 1,
	},
};

test("exports and imports Dayleaf Markdown", async () => {
	const markdown = await convertToMd(entries);
	expect(markdown).toContain("## 2025-09-12 ·");
	expect(markdown).toContain("# A \\*safe\\* title");
	const imported = parseMiniDiaryMd(markdown);
	expect(imported["2025-09-12"].title).toBe("A *safe* title");
	expect(imported["2025-09-12"].text).toBe(entries["2025-09-12"].text);
});

test("imports one Markdown document into a selected day", () => {
	const imported = parseSingleEntryMd("# My day\n\nA **good** day.", "2025-09-13");
	expect(imported["2025-09-13"].title).toBe("My day");
	expect(imported["2025-09-13"].text).toBe("A **good** day.");
});
