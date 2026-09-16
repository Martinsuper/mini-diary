import { $convertFromMarkdownString, $convertToMarkdownString } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import debounce from "lodash.debounce";
import { Moment } from "moment-timezone";
import React, {
	FormEvent,
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { markDirty, registerDraft } from "../../../../utils/persistence";
import { Entries, IndexDate, MarkdownEditorMode } from "../../../../types";
import { toIndexDate, toLocaleWeekday } from "../../../../utils/dateFormat";
import { translations } from "../../../../utils/i18n";
import {
	escapeMarkdownText,
	MARKDOWN_NODES,
	MARKDOWN_TRANSFORMERS,
	normalizeMarkdown,
} from "../../../../utils/markdown";
import { renderMarkdownPreview } from "../../../../utils/markdownExtras";
import EditorToolbar from "../editor-toolbar/editor-toolbar/EditorToolbar";
import CodeHighlightPlugin from "./CodeHighlightPlugin";
import SafeLinkPlugin from "./SafeLinkPlugin";

const AUTOSAVE_INTERVAL = 500;

export interface StateProps {
	enableMarkdownShortcuts: boolean;
	enableSpellcheck: boolean;
	hideTitles: boolean;
	markdownEditorMode: MarkdownEditorMode;
	dateSelected: Moment;
	entries: Entries;
}

export interface DispatchProps {
	updateEntry: (entryDate: IndexDate, title: string, text: string) => void;
	updateMarkdownEditorMode: (mode: MarkdownEditorMode) => void;
}

type Props = StateProps & DispatchProps;

interface BodyEditorProps {
	enableMarkdownShortcuts: boolean;
	onChange: (text: string) => void;
	spellCheck: boolean;
}

function containsUnsupportedMarkdown(markdown: string): boolean {
	return /(^|\n)\s*\|.+\|\s*(\n|$)|!\[[^\]]*\]\([^)]*\)|\$\$|```(?:mermaid|math)/i.test(markdown);
}

function BodyEditor({
	enableMarkdownShortcuts,
	onChange,
	spellCheck,
}: BodyEditorProps): ReactElement {
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
			<CodeHighlightPlugin />
			<HorizontalRulePlugin />
			<ListPlugin />
			<LinkPlugin />
			<SafeLinkPlugin />
			{enableMarkdownShortcuts && <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />}
			<OnChangePlugin
				ignoreSelectionChange
				onChange={(editorState): void => {
					editorState.read((): void =>
						onChange(normalizeMarkdown($convertToMarkdownString(MARKDOWN_TRANSFORMERS))),
					);
				}}
			/>
		</div>
	);
}

export default function Editor(props: Props): ReactElement {
	const {
		dateSelected,
		enableMarkdownShortcuts,
		enableSpellcheck,
		entries,
		hideTitles,
		markdownEditorMode,
		updateEntry,
		updateMarkdownEditorMode,
	} = props;
	const indexDate = toIndexDate(dateSelected);
	const entry = entries[indexDate];
	const entryText =
		entry?.textFormat === "plain"
			? entry.text.split("\n").map(escapeMarkdownText).join("\n\n")
			: entry?.text ?? "";
	const [title, setTitle] = useState(entry?.title ?? "");
	const [text, setText] = useState(entryText);
	const titleRef = useRef<HTMLDivElement | null>(null);
	const latestTitleRef = useRef(title);
	latestTitleRef.current = title;
	const setTitleElement = useCallback((element: HTMLDivElement | null): void => {
		titleRef.current = element;
		if (titleRef.current) titleRef.current.textContent = latestTitleRef.current;
	}, []);

	const saveEntry = useMemo(
		() =>
			debounce((nextTitle: string, nextText: string): void => {
				updateEntry(indexDate, nextTitle.trim(), normalizeMarkdown(nextText));
			}, AUTOSAVE_INTERVAL),
		[indexDate, updateEntry],
	);
	const initialConfig = useMemo(
		() => ({
			theme: {
				code: "lexical-code-block",
				text: {
					strikethrough: "lexical-text-strikethrough",
				},
			},
			editorState: (): void => {
				$convertFromMarkdownString(entryText, MARKDOWN_TRANSFORMERS);
			},
			namespace: "dayleaf",
			nodes: MARKDOWN_NODES,
			onError: (error: Error): void => {
				throw error;
			},
		}),
		[indexDate, markdownEditorMode],
	);

	useEffect(
		() =>
			registerDraft(() => {
				saveEntry.flush();
			}),
		[saveEntry],
	);
	useEffect(() => {
		const handleShortcut = (event: KeyboardEvent): void => {
			if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.key.toLowerCase() !== "m")
				return;
			event.preventDefault();
			saveEntry.flush();
			updateMarkdownEditorMode(markdownEditorMode === "rich" ? "source" : "rich");
		};
		window.addEventListener("keydown", handleShortcut);
		return (): void => window.removeEventListener("keydown", handleShortcut);
	}, [markdownEditorMode, saveEntry, updateMarkdownEditorMode]);
	useEffect((): void => {
		const entryTitle = entry?.title ?? "";
		setTitle(entryTitle);
		setText(entryText);
		if (titleRef.current) titleRef.current.textContent = entryTitle;
	}, [entry?.title, entryText, indexDate]);

	const onTitleInput = (event: FormEvent<HTMLDivElement>): void => {
		const nextTitle = event.currentTarget.textContent || "";
		setTitle(nextTitle);
		markDirty();
		saveEntry(nextTitle, text);
	};
	const onTextChange = (nextText: string): void => {
		setText(nextText);
		markDirty();
		saveEntry(title, nextText);
	};
	const insertMarkdown = (markdown: string): void => {
		const nextText = normalizeMarkdown(`${text}${text ? "\n\n" : ""}${markdown}`);
		setText(nextText);
		saveEntry(title, nextText);
		saveEntry.flush();
		if (markdownEditorMode !== "source") updateMarkdownEditorMode("source");
	};
	const setMode = (mode: MarkdownEditorMode): void => {
		saveEntry.flush();
		updateMarkdownEditorMode(mode);
	};
	const createBody = (): ReactElement => {
		if (markdownEditorMode === "source") {
			return (
				<textarea
					className="markdown-source"
					aria-label={translations["markdown-source"]}
					placeholder={`${translations["write-something"]}…`}
					spellCheck={false}
					value={text}
					onBlur={(): void => saveEntry.flush()}
					onChange={(event): void => onTextChange(event.currentTarget.value)}
				/>
			);
		}
		if (containsUnsupportedMarkdown(text)) {
			// Preview HTML is generated by renderMarkdownPreview after escaping user input.
			/* eslint-disable react/no-danger */
			const preview = (
				<div
					className="markdown-extended-preview"
					dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(text) }}
				/>
			);
			/* eslint-enable react/no-danger */
			return preview;
		}
		return (
			<BodyEditor
				enableMarkdownShortcuts={enableMarkdownShortcuts}
				onChange={onTextChange}
				spellCheck={enableSpellcheck}
			/>
		);
	};
	const onTitleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
		if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
		event.preventDefault();
		document.querySelector<HTMLElement>(".lexical-content-editable, .markdown-source")?.focus();
	};

	return (
		<LexicalComposer initialConfig={initialConfig} key={`${indexDate}-${markdownEditorMode}`}>
			<form className="editor">
				<div className="editor-scrollable">
					<p className="text-faded">{toLocaleWeekday(dateSelected)}</p>
					{!hideTitles && (
						<div className="editor-title-wrapper">
							<div
								aria-label={translations["add-a-title"]}
								className={`editor-title-input ${title ? "" : "is-empty"}`}
								contentEditable
								ref={setTitleElement}
								onBlur={(): void => saveEntry.flush()}
								onInput={onTitleInput}
								onKeyDown={onTitleKeyDown}
								role="textbox"
								spellCheck={enableSpellcheck}
								suppressContentEditableWarning
							/>
						</div>
					)}
					{containsUnsupportedMarkdown(text) && (
						<p className="markdown-warning" role="status">
							{translations["preview-readonly"]}
							{markdownEditorMode === "rich" && (
								<button type="button" className="button" onClick={() => setMode("source")}>
									{translations["markdown-source"]}
								</button>
							)}
						</p>
					)}
					<div className="editor-text-wrapper">{createBody()}</div>
				</div>
				<EditorToolbar
					readOnly={containsUnsupportedMarkdown(text)}
					markdown={text}
					mode={markdownEditorMode}
					onInsertMarkdown={insertMarkdown}
					onModeChange={setMode}
				/>
			</form>
		</LexicalComposer>
	);
}
