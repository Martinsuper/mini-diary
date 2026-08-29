import React, { ReactElement, useEffect, useState } from "react";

import { translations } from "../../../../utils/i18n";
import DiaryResetButtonContainer from "./diary-reset-button/DiaryResetButtonContainer";

export interface StateProps {
	hashedPassword: string;
}

export interface DispatchProps {
	testFileExists: () => void;
}

type Props = StateProps & DispatchProps;

export default function FileDirPref(props: Props): ReactElement {
	const { hashedPassword, testFileExists } = props;
	const isLocked = hashedPassword === "";
	const [filePath, setFilePath] = useState("");

	useEffect((): void => {
		void window.miniDiary.diary.getPath().then(setFilePath);
	}, []);

	const selectMoveDir = async (): Promise<void> => {
		const directory = await window.miniDiary.dialogs.selectDirectory(translations["move-file"]);
		if (!directory) {
			return;
		}
		try {
			setFilePath(await window.miniDiary.diary.move(directory));
		} catch (error) {
			void window.miniDiary.dialogs.showError(
				translations["move-error-title"],
				`${translations["move-error-msg"]}: ${error.message}`,
			);
		}
	};

	const selectDir = async (): Promise<void> => {
		const directory = await window.miniDiary.dialogs.selectDirectory(translations["select-directory"]);
		if (!directory) {
			return;
		}
		await window.miniDiary.diary.setDirectory(directory);
		setFilePath(await window.miniDiary.diary.getPath());
		testFileExists();
	};

	return (
		<fieldset className="fieldset-file-dir">
			<legend>{translations["diary-file"]}</legend>
			<div className="fieldset-content">
				<div className="form-group">
					<p className="file-dir">{filePath}</p>
					<button
						type="button"
						className="button button-main"
						onClick={isLocked ? selectDir : selectMoveDir}
					>
						{isLocked ? translations["change-directory"] : translations["move-file"]}
					</button>
					<DiaryResetButtonContainer />
				</div>
			</div>
		</fieldset>
	);
}
