import { Translations } from "../../../shared/types";
import { getBootstrap } from "../../bootstrap";

export function getLang(): string {
	return getBootstrap().lang;
}

export function getTranslation(
	i18nKey: keyof Translations,
	substitutions: Record<string, string>,
): string {
	return Object.entries(substitutions).reduce(
		(translation, [key, replacement]) =>
			translation.replace(new RegExp(`{${key}}`, "g"), replacement),
		getBootstrap().translations[i18nKey],
	);
}

export function getTranslations(): Record<string, string> {
	return getBootstrap().translations;
}

export function disableMenuItems(): void {}

export function enableMenuItems(): void {}
