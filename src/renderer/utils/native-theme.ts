import { Theme, ThemePref } from "../types";

export function supportsNativeTheme(): boolean {
	return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

export function getThemeFromPref(themePref: ThemePref): Theme {
	if (themePref === "auto") {
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}
	return themePref;
}
