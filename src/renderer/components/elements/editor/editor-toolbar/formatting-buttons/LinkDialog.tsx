import React, { ReactElement, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import trapDialogFocus from "../../../../../utils/dialogFocus";
import { translations } from "../../../../../utils/i18n";
import { isSafeExternalUrl } from "../../../../../utils/markdown";

interface Props {
	onApply: (url: string) => void;
	onClose: () => void;
}
export default function LinkDialog({ onApply, onClose }: Props): ReactElement {
	const ref = useRef<HTMLDivElement>(null);
	const [url, setUrl] = useState("https://");
	const [invalid, setInvalid] = useState(false);
	useEffect(() => {
		if (ref.current) return trapDialogFocus(ref.current, onClose);
		return undefined;
	}, []);
	return createPortal(
		<div
			role="presentation"
			className="overlay-outer link-dialog-backdrop"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<div
				className="overlay-inner link-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="link-heading"
				tabIndex={-1}
				ref={ref}
			>
				<form
					className="overlay-content"
					onSubmit={(event) => {
						event.preventDefault();
						if (!isSafeExternalUrl(url.trim())) {
							setInvalid(true);
							return;
						}
						onApply(url.trim());
					}}
				>
					<h1 id="link-heading">{translations["link-prompt"]}</h1>
					<input
						aria-label={translations.link}
						aria-invalid={invalid}
						aria-describedby={invalid ? "link-error" : undefined}
						value={url}
						onChange={(event) => {
							setUrl(event.target.value);
							setInvalid(false);
						}}
					/>
					{invalid && (
						<p id="link-error" role="alert">
							{translations["link-invalid"]}
						</p>
					)}
					<div className="link-dialog-actions">
						<button type="submit" className="button button-main">
							{translations["link-apply"]}
						</button>
						<button type="button" className="button" onClick={onClose}>
							{translations.close}
						</button>
					</div>
				</form>
			</div>
		</div>,
		document.querySelector(".app-window") || document.body,
	);
}
