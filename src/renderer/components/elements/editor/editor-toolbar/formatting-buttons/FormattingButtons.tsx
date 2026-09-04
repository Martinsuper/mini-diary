import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, LexicalEditor, SELECTION_CHANGE_COMMAND } from "lexical";
import BoldIcon from "feather-icons/dist/icons/bold.svg";
import ItalicIcon from "feather-icons/dist/icons/italic.svg";
import UlIcon from "feather-icons/dist/icons/list.svg";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React, { ReactElement, useEffect, useState } from "react";

import OlIcon from "../../../../../assets/icons/ordered-list.svg";
import { translations } from "../../../../../utils/i18n";
import { iconProps } from "../../../../../utils/icons";

const STROKE_WIDTH_DEFAULT = 2;
const STROKE_WIDTH_SELECTED = 3;

interface FormatState {
	isBold: boolean;
	isItalic: boolean;
}

function readFormatState(editor: LexicalEditor, setFormatState: (state: FormatState) => void): void {
	editor.getEditorState().read((): void => {
		const selection = $getSelection();
		if (!$isRangeSelection(selection)) return;
		setFormatState({ isBold: selection.hasFormat("bold"), isItalic: selection.hasFormat("italic") });
	});
}

export default function FormattingButtons(): ReactElement {
	const [editor] = useLexicalComposerContext();
	const [formatState, setFormatState] = useState<FormatState>({ isBold: false, isItalic: false });

	useEffect(() => editor.registerCommand(SELECTION_CHANGE_COMMAND, (): boolean => {
		readFormatState(editor, setFormatState);
		return false;
	}, 0), [editor]);

	return (
		<div className="formatting-buttons">
			<button
				type="button"
				className={`button button-invisible ${formatState.isBold ? "button-active" : ""}`}
				onClick={(): void => { editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold"); }}
			>
				<BoldIcon {...iconProps} strokeWidth={formatState.isBold ? STROKE_WIDTH_SELECTED : STROKE_WIDTH_DEFAULT} title={translations.bold} />
			</button>
			<button
				type="button"
				className={`button button-invisible ${formatState.isItalic ? "button-active" : ""}`}
				onClick={(): void => { editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic"); }}
			>
				<ItalicIcon {...iconProps} strokeWidth={formatState.isItalic ? STROKE_WIDTH_SELECTED : STROKE_WIDTH_DEFAULT} title={translations.italic} />
			</button>
			<button
				type="button"
				className="button button-invisible"
				onClick={(): void => { editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined); }}
			>
				<UlIcon {...iconProps} strokeWidth={STROKE_WIDTH_DEFAULT} title={translations.bullets} />
			</button>
			<button
				type="button"
				className="button button-invisible"
				onClick={(): void => { editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined); }}
			>
				<OlIcon {...iconProps} className="ordered-list-icon" strokeWidth={STROKE_WIDTH_DEFAULT} title={translations.list} />
			</button>
		</div>
	);
}
