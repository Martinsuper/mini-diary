import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, $convertToMarkdownString } from "@lexical/markdown";
import { useEffect } from "react";
import { MARKDOWN_TRANSFORMERS, normalizeMarkdown } from "../../../../utils/markdown";

/** Synchronize externally imported content without resetting selection for ordinary autosaves. */
export default function ExternalEntryPlugin({ text }: { text: string }): null {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		editor.update(() => {
			if (
				normalizeMarkdown($convertToMarkdownString(MARKDOWN_TRANSFORMERS)) !==
				normalizeMarkdown(text)
			)
				$convertFromMarkdownString(text, MARKDOWN_TRANSFORMERS);
		});
	}, [editor, text]);
	return null;
}
