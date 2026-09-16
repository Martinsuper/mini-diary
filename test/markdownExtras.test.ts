import { parseMarkdownTable, renderMarkdownPreview } from "../src/renderer/utils/markdownExtras";

test("parses a Markdown table", () => {
	expect(parseMarkdownTable("| Day | Mood |\n| --- | --- |\n| Mon | Great |")).toStrictEqual({
		header: ["Day", "Mood"],
		rows: [["Mon", "Great"]],
	});
});

test("renders extended Markdown without allowing raw HTML", () => {
	const preview = renderMarkdownPreview("<script>alert(1)</script>\n\n$$x + y$$");
	expect(preview).not.toContain("<script>");
	expect(preview).toContain("&lt;script&gt;");
	expect(preview).toContain('class="markdown-math"');
});
