import React, { PureComponent, ReactNode } from "react";

import { getBootstrap } from "../../../bootstrap";
import { ImportFormat } from "../../../types";
import { translate, translations } from "../../../utils/i18n";
import OverlayContainer from "../overlay-hoc/OverlayContainer";

const { appName } = getBootstrap();
const fields = {
	jsonDayOne: {
		title: translate("import-from-format", { format: "JSON (Day One)" }),
		extension: "json" as const,
		instructions: <p>{translate("import-instructions-day-one", { appName, format: "JSON" })}</p>,
	},
	jsonJrnl: {
		title: translate("import-from-format", { format: "JSON (jrnl)" }),
		extension: "json" as const,
		instructions: (
			<p>
				{translate("import-instructions-jrnl", { appName }).split(/{.*?}/)[0]}
				<code>jrnl --export json -o jrnl-export.json</code>
				{translate("import-instructions-jrnl", { appName }).split(/{.*?}/)[1]}
			</p>
		),
	},
	jsonMiniDiary: {
		title: translate("import-from-format", { format: "JSON (Mini Diary)" }),
		extension: "json" as const,
		instructions: <p>{translate("import-instructions-mini-diary", { appName })}</p>,
	},
	txtDayOne: {
		title: translate("import-from-format", { format: "TXT (Day One)" }),
		extension: "txt" as const,
		instructions: (
			<p>{translate("import-instructions-day-one", { appName, format: "Plain Text" })}</p>
		),
	},
};

export interface StateProps {
	importFormat: ImportFormat;
}

export interface DispatchProps {
	runImport: (content: string) => void;
}

type Props = StateProps & DispatchProps;

export default class ImportOverlay extends PureComponent<Props, {}> {
	static showImportFormatError(): void {
		const errMsg = "No import format selected";
		console.error(`Error importing diary file: ${errMsg}`);
		void window.miniDiary.dialogs.showError(translations["import-error-title"], errMsg);
	}

	async selectAndImportFile(): Promise<void> {
		const { importFormat, runImport } = this.props;
		if (!importFormat) {
			ImportOverlay.showImportFormatError();
			return;
		}
		const content = await window.miniDiary.dialogs.importFile(fields[importFormat].extension);
		if (content !== null) runImport(content);
	}

	render(): ReactNode {
		const { importFormat } = this.props;
		if (!importFormat) {
			ImportOverlay.showImportFormatError();
			return null;
		}
		return (
			<OverlayContainer className="import-overlay">
				<h1>{fields[importFormat].title}</h1>
				{fields[importFormat].instructions}
				<button
					type="button"
					className="button button-main"
					onClick={(): void => {
						void this.selectAndImportFile();
					}}
				>
					{translations["start-import"]}
				</button>
			</OverlayContainer>
		);
	}
}
