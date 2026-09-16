import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
	BOLD_ITALIC_STAR,
	BOLD_ITALIC_UNDERSCORE,
	BOLD_STAR,
	BOLD_UNDERSCORE,
	CHECK_LIST,
	CODE,
	ElementTransformer,
	HEADING,
	INLINE_CODE,
	ITALIC_STAR,
	ITALIC_UNDERSCORE,
	LINK,
	ORDERED_LIST,
	QUOTE,
	STRIKETHROUGH,
	UNORDERED_LIST,
} from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
	$createHorizontalRuleNode,
	$isHorizontalRuleNode,
	HorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode";
import { Klass, LexicalNode } from "lexical";

const HORIZONTAL_RULE: ElementTransformer = {
	dependencies: [HorizontalRuleNode],
	export: (node) => ($isHorizontalRuleNode(node) ? "---" : null),
	regExp: /^(---|\*\*\*|___)\s?$/,
	replace: (parentNode) => {
		parentNode.replace($createHorizontalRuleNode());
	},
	type: "element",
};

export const MARKDOWN_TRANSFORMERS = [
	HORIZONTAL_RULE,
	HEADING,
	QUOTE,
	CODE,
	CHECK_LIST,
	UNORDERED_LIST,
	ORDERED_LIST,
	INLINE_CODE,
	BOLD_ITALIC_STAR,
	BOLD_ITALIC_UNDERSCORE,
	BOLD_STAR,
	BOLD_UNDERSCORE,
	ITALIC_STAR,
	ITALIC_UNDERSCORE,
	STRIKETHROUGH,
	LINK,
];

export const MARKDOWN_NODES: Array<Klass<LexicalNode>> = [
	HeadingNode,
	QuoteNode,
	ListNode,
	ListItemNode,
	CodeNode,
	CodeHighlightNode,
	LinkNode,
	AutoLinkNode,
	HorizontalRuleNode,
];

export function normalizeMarkdown(markdown: string): string {
	return markdown.replace(/\r\n?/g, "\n").trim();
}

export function escapeMarkdownText(text: string): string {
	return text.replace(/([\\`*_[\]<>#])/g, "\\$1");
}

export function isSafeExternalUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return (
			parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:"
		);
	} catch (_) {
		return false;
	}
}
