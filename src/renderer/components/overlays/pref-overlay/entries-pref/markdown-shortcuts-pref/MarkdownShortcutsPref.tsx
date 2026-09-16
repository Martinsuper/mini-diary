import React, { ReactElement } from "react";

import { translations } from "../../../../../utils/i18n";

export interface StateProps {
	enableMarkdownShortcuts: boolean;
}
export interface DispatchProps {
	updateMarkdownShortcutsPref: (enabled: boolean) => void;
}
type Props = StateProps & DispatchProps;

export default function MarkdownShortcutsPref({
	enableMarkdownShortcuts,
	updateMarkdownShortcutsPref,
}: Props): ReactElement {
	return (
		<label htmlFor="enable-markdown-shortcuts">
			<input
				id="enable-markdown-shortcuts"
				type="checkbox"
				checked={enableMarkdownShortcuts}
				onChange={(event): void => updateMarkdownShortcutsPref(event.currentTarget.checked)}
			/>{" "}
			{translations["enable-markdown-shortcuts"]}
		</label>
	);
}
