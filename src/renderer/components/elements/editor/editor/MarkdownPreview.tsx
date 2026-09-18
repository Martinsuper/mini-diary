import React, { ReactElement, useContext, useEffect, useRef } from "react";
import { renderMarkdownPreview } from "../../../../utils/markdownExtras";
import { renderDiagrams } from "../../../../utils/renderDiagrams";
import ThemeContext from "../../../ThemeContext";

/** Keep rich document preview independent of the editable source and its selection. */
export default function MarkdownPreview({ text }: { text: string }): ReactElement {
	const ref = useRef<HTMLDivElement>(null);
	const theme = useContext(ThemeContext);
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		element.innerHTML = renderMarkdownPreview(text);
		void renderDiagrams(element, theme === "dark");
	}, [text, theme]);
	return <div className="markdown-extended-preview" ref={ref} />;
}
