// Trap modal focus and restore the triggering control when dismissed.
export default function trapDialogFocus(element: HTMLElement, close: () => void): () => void {
	const previous = document.activeElement as HTMLElement | null;
	const focusable = (): HTMLElement[] =>
		Array.from(
			element.querySelectorAll<HTMLElement>(
				'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]',
			),
		).filter((item) => item.getClientRects().length > 0);
	const focusFirst = (): void => {
		(focusable()[0] || element).focus();
	};
	const onFocus = (event: FocusEvent): void => {
		if (!element.contains(event.target as Node)) focusFirst();
	};
	const onKey = (event: KeyboardEvent): void => {
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			close();
		}
		if (event.key !== "Tab") return;
		const items = focusable();
		const first = items[0] || element;
		const last = items[items.length - 1] || element;
		if (
			event.shiftKey &&
			(document.activeElement === first || document.activeElement === element)
		) {
			event.preventDefault();
			last.focus();
		} else if (
			!event.shiftKey &&
			(document.activeElement === last || document.activeElement === element)
		) {
			event.preventDefault();
			first.focus();
		}
	};
	document.addEventListener("keydown", onKey, true);
	document.addEventListener("focusin", onFocus);
	focusFirst();
	return () => {
		document.removeEventListener("keydown", onKey, true);
		document.removeEventListener("focusin", onFocus);
		if (previous?.isConnected) previous.focus();
	};
}
