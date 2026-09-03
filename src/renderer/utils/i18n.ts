import moment from "moment-timezone";

import { Translations } from "../../shared/types";
import { getBootstrap } from "../bootstrap";

const bootstrap = getBootstrap();

export const lang = bootstrap.lang;
export const translations = bootstrap.translations as unknown as Translations;

export function initI18n(): void {
	moment.locale(lang);
}

export function translate(
	i18nKey: keyof Translations,
	substitutions: Record<string, string> = {},
): string {
	return Object.entries(substitutions).reduce(
		(translation, [key, replacement]) => translation.replace(new RegExp(`{${key}}`, "g"), replacement),
		translations[i18nKey],
	);
}
