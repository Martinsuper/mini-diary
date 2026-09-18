import React, { ReactElement } from "react";

import { lang, translations } from "../../../utils/i18n";
import OverlayContainer from "../overlay-hoc/OverlayContainer";
import EntriesPref from "./entries-pref/EntriesPref";
import FileDirPrefContainer from "./file-dir-pref/FileDirPrefContainer";
import FirstDayOfWeekPrefContainer from "./first-day-of-week-pref/FirstDayOfWeekPrefContainer";
import PasswordPrefContainer from "./password-pref/PasswordPrefContainer";
import ThemePrefContainer from "./theme-pref/ThemePrefContainer";
import BackupRecovery from "./file-dir-pref/BackupRecovery";

export interface StateProps {
	isUnlocked: boolean;
}

type Props = StateProps;

/**
 * Overlay window for user preferences
 */
export default function PrefOverlay(props: Props): ReactElement {
	const { isUnlocked } = props;

	const isLocked = !isUnlocked;
	const zh = lang.startsWith("zh");

	return (
		<OverlayContainer className="pref-overlay">
			<h1>{translations.preferences}</h1>
			<nav className="pref-tabs" aria-label={translations.preferences}>
				{[
					["appearance", translations.appearance],
					["editing", translations.edit],
					["data", zh ? "数据" : "Data"],
					["security", zh ? "安全" : "Security"],
				].map(([id, label]) => (
					<button
						key={id}
						type="button"
						className="button button-invisible"
						onClick={() =>
							document.getElementById(`pref-${id}`)?.scrollIntoView({ block: "start" })
						}
					>
						{label}
					</button>
				))}
			</nav>
			<form className="preferences-form">
				<section id="pref-appearance" aria-label={translations.appearance}>
					<ThemePrefContainer />
				</section>
				<section id="pref-editing" aria-label={translations.edit}>
					{!isLocked && <FirstDayOfWeekPrefContainer />}
					{!isLocked && <EntriesPref />}
				</section>
				<section id="pref-data" aria-label={zh ? "数据" : "Data"}>
					<FileDirPrefContainer />
					<BackupRecovery />
				</section>
				<section id="pref-security" aria-label={zh ? "安全" : "Security"}>
					{!isLocked && <PasswordPrefContainer />}
				</section>
			</form>
		</OverlayContainer>
	);
}
