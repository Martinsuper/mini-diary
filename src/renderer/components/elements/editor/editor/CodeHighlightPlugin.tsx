import { registerCodeHighlighting } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ReactElement, useEffect } from "react";

export default function CodeHighlightPlugin(): ReactElement | null {
	const [editor] = useLexicalComposerContext();
	useEffect(() => registerCodeHighlighting(editor), [editor]);
	return null;
}
