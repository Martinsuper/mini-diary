import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
	BOLD_STAR,
	BOLD_UNDERSCORE,
	ITALIC_STAR,
	ITALIC_UNDERSCORE,
	ORDERED_LIST,
	UNORDERED_LIST,
} from "@lexical/markdown";
import { ListItemNode, ListNode } from "@lexical/list";
import { createEditor } from "lexical";

const transformers = [
	BOLD_STAR,
	BOLD_UNDERSCORE,
	ITALIC_STAR,
	ITALIC_UNDERSCORE,
	ORDERED_LIST,
	UNORDERED_LIST,
];

function roundTrip(markdown: string): string {
	const editor = createEditor({
		namespace: "test",
		nodes: [ListNode, ListItemNode],
		onError: (error) => {
			throw error;
		},
	});
	editor.update(
		(): void => {
			$convertFromMarkdownString(markdown, transformers);
		},
		{ discrete: true },
	);
	let output = "";
	editor.getEditorState().read((): void => {
		output = $convertToMarkdownString(transformers).trim();
	});
	return output;
}

test("preserves Mini Diary rich-text markdown", () => {
	const markdown = "A **bold** and *italic* entry.\n\n- first\n- second\n\n1. one\n2. two";
	expect(roundTrip(markdown)).toBe(markdown);
});
