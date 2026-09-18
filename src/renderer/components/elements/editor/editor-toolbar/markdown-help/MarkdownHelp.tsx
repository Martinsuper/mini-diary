import { IconHelpCircle } from "@tabler/icons-react";
import React, { ReactElement, useEffect, useRef, useState } from "react";

import { lang, translations } from "../../../../../utils/i18n";
import { iconProps } from "../../../../../utils/icons";
import mdToTxt from "../../../../../utils/mdToTxt";

const SYNTAX = [
	["# Heading", translations["heading-1"]],
	["**bold**", translations.bold],
	["*italic*", translations.italic],
	["~~strike~~", translations.strikethrough],
	["[text](https://example.com)", translations.link],
	["> quote", translations.quote],
	["- item / 1. item", translations.list],
	["- [ ] task", translations.checklist],
	["`code` / ```", translations["inline-code"]],
	["---", translations["horizontal-rule"]],
];

interface Props {
	markdown: string;
}

export default function MarkdownHelp({ markdown }: Props): ReactElement {
	const [isOpen, setIsOpen] = useState(false);
	const [copied, setCopied] = useState("");
	const copyText = async (plain: boolean): Promise<void> => {
		try {
			await navigator.clipboard.writeText(plain ? await mdToTxt(markdown) : markdown);
			setCopied(lang.startsWith("zh") ? "已复制" : "Copied");
		} catch (error) {
			setCopied(error.message);
		}
	};
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return undefined;
		const closeOnEscape = (event: KeyboardEvent): void => {
			if (event.key === "Escape") {
				setIsOpen(false);
				containerRef.current?.querySelector("button")?.focus();
			}
		};

		const closeOnOutsideClick = (event: MouseEvent): void => {
			if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
		};

		document.addEventListener("mousedown", closeOnOutsideClick);
		document.addEventListener("keydown", closeOnEscape);
		return (): void => {
			document.removeEventListener("mousedown", closeOnOutsideClick);
			document.removeEventListener("keydown", closeOnEscape);
		};
	}, [isOpen]);

	return (
		<div className="markdown-help" ref={containerRef}>
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
								void copyText(false);
							}}
						>
							{translations["copy-markdown"]}
						</button>
						<button
							type="button"
							className="button"
							onClick={(): void => {
								void copyText(true);
							}}
						>
							{translations["copy-plain-text"]}
						</button>
					</div>
					<p role="status">{copied}</p>
				</div>
			)}
		</div>
	);
}
