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
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import debounce from "lodash.debounce";
import { Moment } from "moment-timezone";
import React, { FormEvent, ReactElement, useEffect, useMemo, useState } from "react";

import { Entries, IndexDate } from "../../../../types";
import { toIndexDate, toLocaleWeekday } from "../../../../utils/dateFormat";
import { titleDisplayValue } from "../../../../utils/entryTitle";
import { translations } from "../../../../utils/i18n";
import EditorToolbar from "../editor-toolbar/editor-toolbar/EditorToolbar";

const AUTOSAVE_INTERVAL = 500;
const MARKDOWN_TRANSFORMERS = [
	BOLD_STAR,
	BOLD_UNDERSCORE,
	ITALIC_STAR,
	ITALIC_UNDERSCORE,
	ORDERED_LIST,
	UNORDERED_LIST,
];

export interface StateProps {
	enableSpellcheck: boolean;
	hideTitles: boolean;
	dateSelected: Moment;
	entries: Entries;
}

export interface DispatchProps {
	updateEntry: (entryDate: IndexDate, title: string, text: string) => void;
}

type Props = StateProps & DispatchProps;

interface BodyEditorProps {
	onChange: (text: string) => void;
	spellCheck: boolean;
}

function BodyEditor({ onChange, spellCheck }: BodyEditorProps): ReactElement {
	return (
		<div className="lexical-editor">
			<RichTextPlugin
				contentEditable={
					<ContentEditable
						aria-placeholder={translations["write-something"]}
						className="lexical-content-editable"
						placeholder={
							<div className="lexical-placeholder">{`${translations["write-something"]}…`}</div>
						}
						spellCheck={spellCheck}
					/>
				}
				placeholder={null}
				ErrorBoundary={LexicalErrorBoundary}
			/>
			<HistoryPlugin />
			<ListPlugin />
			<MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
			<OnChangePlugin
				ignoreSelectionChange
				onChange={(editorState): void => {
					editorState.read((): void =>
						onChange($convertToMarkdownString(MARKDOWN_TRANSFORMERS).trim()),
					);
				}}
			/>
		</div>
	);
}

export default function Editor(props: Props): ReactElement {
	const { dateSelected, enableSpellcheck, entries, hideTitles, updateEntry } = props;
	const indexDate = toIndexDate(dateSelected);
	const entry = entries[indexDate];
	const [title, setTitle] = useState(entry?.title ?? "");
	const [text, setText] = useState(entry?.text ?? "");

	const saveEntry = useMemo(
		() =>
			debounce((nextTitle: string, nextText: string): void => {
				updateEntry(indexDate, nextTitle.trim(), nextText.trim());
			}, AUTOSAVE_INTERVAL),
		[indexDate, updateEntry],
	);
	const initialConfig = useMemo(
		() => ({
			editorState: (): void => {
				$convertFromMarkdownString(entry?.text ?? "", MARKDOWN_TRANSFORMERS);
			},
			namespace: "mini-diary",
			nodes: [ListNode, ListItemNode],
			onError: (error: Error): void => {
				throw error;
			},
		}),
		[indexDate],
	);

	useEffect(() => (): void => saveEntry.flush(), [saveEntry]);
	useEffect((): void => {
		setTitle(entry?.title ?? "");
		setText(entry?.text ?? "");
	}, [indexDate]);

	const onTitleInput = (event: FormEvent<HTMLDivElement>): void => {
		const nextTitle = event.currentTarget.textContent || "";
		setTitle(nextTitle);
		saveEntry(nextTitle, text);
	};

	const onTextChange = (nextText: string): void => {
		setText(nextText);
		saveEntry(title, nextText);
	};

	const onTitleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
		if (event.key !== "Enter") return;
		event.preventDefault();
		document.querySelector<HTMLDivElement>(".lexical-content-editable")?.focus();
	};

	return (
		<LexicalComposer initialConfig={initialConfig} key={indexDate}>
			<form className="editor">
				<div className="editor-scrollable">
					<p className="text-faded">{toLocaleWeekday(dateSelected)}</p>
					{!hideTitles && (
						<div className="editor-title-wrapper">
							<div
								aria-label={translations["add-a-title"]}
								className={`editor-title-input ${title ? "" : "is-empty"}`}
								contentEditable
								onBlur={(): void => saveEntry.flush()}
								onInput={onTitleInput}
								onKeyDown={onTitleKeyDown}
								role="textbox"
								spellCheck={enableSpellcheck}
								suppressContentEditableWarning
							>
								{titleDisplayValue(title)}
							</div>
						</div>
					)}
					<div className="editor-text-wrapper">
						<BodyEditor onChange={onTextChange} spellCheck={enableSpellcheck} />
					</div>
				</div>
				<EditorToolbar />
			</form>
		</LexicalComposer>
	);
}
