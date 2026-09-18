import { subscribeIndex } from "../../utils/searchIndex";
import { flushPersistence } from "../../utils/persistence";
import { OverlayType } from "../../../shared/types";
import { openOverlay, setTheme } from "../../store/app/actionCreators";
import {
	search,
	setDaySelectedPrevious,
	setDaySelectedNext,
	setDaySelectedToday,
	setMonthSelectedNext,
	setMonthSelectedPrevious,
} from "../../store/diary/actionCreators";
import {
	exportToJsonMiniDiary,
	exportToMd,
	exportToPdf,
	exportToTxtDayOne,
} from "../../store/export/actionCreators";
import { lock } from "../../store/file/actionCreators";
import { setImportFormat } from "../../store/import/actionCreators";
import store, { ThunkDispatchT } from "../../store/store";

const dispatchThunk = store.dispatch as ThunkDispatchT;

export default function initIpcListeners(): void {
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
		if (store.getState().app.themePref === "auto")
			dispatchThunk(setTheme(event.matches ? "dark" : "light"));
	});
	subscribeIndex(() => {
		const key = store.getState().diary.searchKey;
		if (key) dispatchThunk(search(key));
	});
	window.miniDiary.events.onPrepareClose(() => {
		void flushPersistence().then(
			() => window.miniDiary.app.closeReady(),
			(error: Error) => window.miniDiary.app.closeReady(error.message),
		);
	});
	window.miniDiary.events.onMenu((event, overlay): void => {
		switch (event) {
			case "nextDay":
				dispatchThunk(setDaySelectedNext());
				break;
			case "previousDay":
				dispatchThunk(setDaySelectedPrevious());
				break;
			case "goToToday":
				dispatchThunk(setDaySelectedToday());
				break;
			case "nextMonth":
				dispatchThunk(setMonthSelectedNext());
				break;
			case "previousMonth":
				dispatchThunk(setMonthSelectedPrevious());
				break;
			case "exportJsonMiniDiary":
				dispatchThunk(exportToJsonMiniDiary());
				break;
			case "exportMd":
				dispatchThunk(exportToMd());
				break;
			case "exportPdf":
				dispatchThunk(exportToPdf());
				break;
			case "exportTxtDayOne":
				dispatchThunk(exportToTxtDayOne());
				break;
			case "importJsonDayOne":
				dispatchThunk(setImportFormat("jsonDayOne"));
				dispatchThunk(openOverlay("import"));
				break;
			case "importJsonJrnl":
				dispatchThunk(setImportFormat("jsonJrnl"));
				dispatchThunk(openOverlay("import"));
				break;
			case "importJsonMiniDiary":
				dispatchThunk(setImportFormat("jsonMiniDiary"));
				dispatchThunk(openOverlay("import"));
				break;
			case "importMdMiniDiary":
				dispatchThunk(setImportFormat("mdMiniDiary"));
				dispatchThunk(openOverlay("import"));
				break;
			case "importMdSingle":
				dispatchThunk(setImportFormat("mdSingle"));
				dispatchThunk(openOverlay("import"));
				break;
			case "importTxtDayOne":
				dispatchThunk(setImportFormat("txtDayOne"));
				dispatchThunk(openOverlay("import"));
				break;
			case "lock":
				dispatchThunk(lock());
				break;
			default:
				if (overlay) {
					dispatchThunk(openOverlay(overlay as OverlayType));
				}
		}
	});
	window.miniDiary.events.onThemeChange((theme): void => {
		if (store.getState().app.themePref === "auto") dispatchThunk(setTheme(theme));
	});
}
