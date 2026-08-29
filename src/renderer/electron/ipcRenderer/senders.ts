import { Translations } from "../../../shared/types";

export function getLang(): string {
	return window.miniDiary.app.getLang();
}

export function getTranslation(
	i18nKey: keyof Translations,
	substitutions: Record<string, string>,
): string {
	return window.miniDiary.app.getTranslation(i18nKey, substitutions);
}

export function getTranslations(): Record<string, string> {
	return window.miniDiary.app.getTranslations();
}

export function disableMenuItems(): void {}

export function enableMenuItems(): void {}
