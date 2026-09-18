import { $isListItemNode, $isListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TextNode } from "lexical";
import { ReactElement, useEffect } from "react";

/**
 * Lexical handles the leading "- " as a bullet list before its checklist
 * transformer sees the complete "- [ ] " shortcut. Finish that conversion once
 * the marker has been typed inside the new bullet item.
 */
export default function ChecklistShortcutPlugin({
	enabled,
}: {
	enabled: boolean;
}): ReactElement | null {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		if (!enabled) return undefined;
		return editor.registerNodeTransform(TextNode, (node) => {
			const item = node.getParent();
			const list = item?.getParent();
			if (!$isListItemNode(item) || !$isListNode(list) || list.getListType() !== "bullet") return;
			const match = node.getTextContent().match(/^\[([ xX])\]\s$/);
			if (!match) return;

			list.setListType("check");
			item.setChecked(match[1].toLowerCase() === "x");
			node.setTextContent("");
			item.selectEnd();
		});
	}, [editor, enabled]);

	return null;
}
