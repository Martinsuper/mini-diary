import moment from "moment-timezone";
import "moment/locale/de";
import "moment/locale/el";
import "moment/locale/es";
import "moment/locale/fr";
import "moment/locale/is";
import "moment/locale/it";
import "moment/locale/nb";
import "moment/locale/pt";
import "moment/locale/tr";
import "moment/locale/uk";
import "moment/locale/zh-cn";
import "moment/locale/zh-tw";
import { de, el, enUS, es, fr, is, it, nb, pt, tr, uk, zhCN, zhTW } from "date-fns/locale";
import { Locale } from "date-fns";

import { Translations } from "../../shared/types";
import { getBootstrap } from "../bootstrap";

const bootstrap = getBootstrap();

export const lang = bootstrap.lang;
export const translations = bootstrap.translations as unknown as Translations;

const normalizedLang = lang.toLowerCase();
let dateLang = normalizedLang.split("-")[0];
if (normalizedLang.startsWith("zh")) dateLang = /tw|hk|hant/.test(normalizedLang) ? "zh-tw" : "zh-cn";
if (dateLang === "no") dateLang = "nb";
const calendarLocales: Record<string, Locale> = {
	de,
	el,
	en: enUS,
	es,
	fr,
	is,
	it,
	nb,
	pt,
	tr,
	uk,
	"zh-cn": zhCN,
	"zh-tw": zhTW,
};
export const calendarLocale = calendarLocales[dateLang] || enUS;
export function initI18n(): void {
	moment.locale(dateLang);
	document.documentElement.lang = lang;
}

export function translate(
	i18nKey: keyof Translations,
	substitutions: Record<string, string> = {},
): string {
	return Object.entries(substitutions).reduce(
		(translation, [key, replacement]) =>
			translation.replace(new RegExp(`{${key}}`, "g"), replacement),
		translations[i18nKey],
	);
}
