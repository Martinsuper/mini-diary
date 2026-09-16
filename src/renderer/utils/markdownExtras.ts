export interface MarkdownTable {
	header: string[];
	rows: string[][];
}

function splitRow(row: string): string[] {
	return row
		.trim()
		.replace(/^\||\|$/g, "")
		.split("|")
		.map((cell) => cell.trim());
}

export function parseMarkdownTable(markdown: string): MarkdownTable | null {
	const lines = markdown.trim().split("\n");
	if (lines.length < 2 || !/^\s*\|?\s*:?-{3,}/.test(lines[1])) return null;
	const header = splitRow(lines[0]);
	const separators = splitRow(lines[1]);
	if (header.length !== separators.length || !separators.every((cell) => /^:?-{3,}:?$/.test(cell)))
		return null;
	return { header, rows: lines.slice(2).filter(Boolean).map(splitRow) };
}

export function renderMarkdownPreview(markdown: string): string {
	const table = parseMarkdownTable(markdown);
	if (table) {
		const escape = (value: string): string =>
			value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		return `<table><thead><tr>${table.header
			.map((cell) => `<th>${escape(cell)}</th>`)
			.join("")}</tr></thead><tbody>${table.rows
			.map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join("")}</tr>`)
			.join("")}</tbody></table>`;
	}
	const escaped = markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	return escaped
		.replace(/```(?:mermaid)?\n([\s\S]*?)```/g, '<pre class="markdown-diagram">$1</pre>')
		.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="markdown-math">$1</div>')
		.replace(
			/!\[([^\]]*)\]\((data:image\/(?:png|jpeg|gif|webp);base64,[^)]+)\)/g,
			'<img alt="$1" src="$2">',
		)
		.replace(/^### (.+)$/gm, "<h3>$1</h3>")
		.replace(/^## (.+)$/gm, "<h2>$1</h2>")
		.replace(/^# (.+)$/gm, "<h1>$1</h1>")
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/\*([^*]+)\*/g, "<em>$1</em>")
		.replace(/`([^`]+)`/g, "<code>$1</code>")
		.replace(/\n{2,}/g, "<br><br>");
}
