import React, { ReactElement } from "react";

import { translations } from "../../../../../utils/i18n";

export interface StateProps {
	fileExists: boolean;
}

export interface DispatchProps {
	resetDiary: () => Promise<void>;
	testFileExists: () => Promise<void>;
}

type Props = StateProps & DispatchProps;

/**
 * Preference button for resetting the currently selected diary (i.e. deleting the diary file on
 * disk)
 */
export default function DiaryResetButton(props: Props): ReactElement {
	const { fileExists, resetDiary, testFileExists } = props;

	const showResetPrompt = async (): Promise<void> => {
		const confirmed = await window.miniDiary.dialogs.confirmReset(
			translations["reset-diary"],
			translations["reset-diary-msg"],
			translations["reset-diary-confirm"],
			translations.no,
		);
		if (confirmed) {
			try {
				await resetDiary();
				await testFileExists();
			} catch (error) {
				await window.miniDiary.dialogs.showError(translations["reset-diary"], error.message);
			}
		}
	};

	return (
		<button
			type="button"
			className="button button-danger"
			disabled={!fileExists}
			onClick={showResetPrompt}
		>
			{translations["reset-diary"]}
		</button>
	);
}
