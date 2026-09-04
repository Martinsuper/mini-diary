import React, { ReactElement } from "react";

import FormattingButtons from "../formatting-buttons/FormattingButtons";
import WordCountWrapper from "../word-count/WordCountWrapper";

export default function EditorToolbar(): ReactElement {
	return (
		<div
			className="editor-toolbar"
			onMouseDown={(event): void => event.preventDefault()}
			role="none"
		>
			<FormattingButtons />
			<WordCountWrapper />
		</div>
	);
}
