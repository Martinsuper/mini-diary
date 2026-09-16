import { IconHelpCircle } from "@tabler/icons-react";
import React, { ReactElement, useState } from "react";

import { translations } from "../../../../../utils/i18n";
import { iconProps } from "../../../../../utils/icons";
import mdToTxt from "../../../../../utils/mdToTxt";

const SYNTAX = [
	["# Heading", translations["heading-1"]],
	["**bold**", translations.bold],
	["*italic*", translations.italic],
	["~~strike~~", translations.strikethrough],
	["[text](https://…)", translations.link],
	["> quote", translations.quote],
	["- item / 1. item", translations.list],
	["- [ ] task", translations.checklist],
	["`code` / ```", translations["inline-code"]],
	["---", translations["horizontal-rule"]],
];

interface Props {
	markdown: string;
	onInsertMarkdown: (markdown: string) => void;
}

export default function MarkdownHelp({ markdown, onInsertMarkdown }: Props): ReactElement {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div className="markdown-help">
			<button
				type="button"
				className="button button-invisible"
				aria-expanded={isOpen}
				aria-label={translations["markdown-help"]}
				title={translations["markdown-help"]}
				onClick={(): void => setIsOpen(!isOpen)}
			>
				<IconHelpCircle {...iconProps} stroke={1.8} />
			</button>
			{isOpen && (
				<div
					className="markdown-help-popover"
					role="dialog"
					aria-label={translations["markdown-help"]}
				>
					<strong>{translations["markdown-help"]}</strong>
					<table>
						<tbody>
							{SYNTAX.map(([syntax, label]) => (
								<tr key={syntax}>
									<td>
										<code>{syntax}</code>
									</td>
									<td>{label}</td>
								</tr>
							))}
						</tbody>
					</table>
					<div className="markdown-copy-actions">
						<button
							type="button"
							className="button"
							onClick={(): void => {
								void window.miniDiary.dialogs.importImage().then((image) => {
									if (image) onInsertMarkdown(`![${image.name}](${image.dataUrl})`);
								});
							}}
						>
							{translations["insert-image"]}
						</button>
						<button
							type="button"
							className="button"
							onClick={(): void => {
								void navigator.clipboard.writeText(markdown);
							}}
						>
							{translations["copy-markdown"]}
						</button>
						<button
							type="button"
							className="button"
							onClick={(): void => {
								void mdToTxt(markdown).then((text) => navigator.clipboard.writeText(text));
							}}
						>
							{translations["copy-plain-text"]}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
