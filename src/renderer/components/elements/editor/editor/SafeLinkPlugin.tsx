import { $isLinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNearestNodeFromDOMNode } from "lexical";
import { ReactElement, useEffect } from "react";

import { translations } from "../../../../utils/i18n";
import { isSafeExternalUrl } from "../../../../utils/markdown";

export default function SafeLinkPlugin(): ReactElement | null {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		const root = editor.getRootElement();
		if (!root) return undefined;
		const handleClick = (event: MouseEvent): void => {
			const anchor = (event.target as Element | null)?.closest("a");
			if (!anchor) return;
			event.preventDefault();
			let url = "";
			editor.getEditorState().read((): void => {
				const node = $getNearestNodeFromDOMNode(anchor);
				if ($isLinkNode(node)) url = node.getURL();
			});
			if (isSafeExternalUrl(url)) {
				// eslint-disable-next-line no-alert
				const shouldOpen = window.confirm(`${url}\n\n${translations["open-external-link"]}`);
				if (shouldOpen) void window.miniDiary.app.openExternal(url);
			}
		};
		root.addEventListener("click", handleClick);
		return (): void => root.removeEventListener("click", handleClick);
	}, [editor]);
	return null;
}
