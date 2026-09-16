import { parseDayOneJson, parseJrnlJson, parseMiniDiaryJson } from "../../files/import/json";
import { parseMiniDiaryMd, parseSingleEntryMd } from "../../files/import/md";
import { parseDayOneTxt } from "../../files/import/txt";
import { toIndexDate } from "../../utils/dateFormat";
import { ImportFormat } from "../../types";
import { closeOverlay } from "../app/actionCreators";
import { mergeUpdateFile } from "../file/actionCreators";
import { ThunkActionT } from "../store";
import {
	IMPORT_ERROR,
	IMPORT_IN_PROGRESS,
	IMPORT_SUCCESS,
	SET_IMPORT_FORMAT,
	SetImportErrorAction,
	SetImportFormatAction,
	SetImportInProgressAction,
	SetImportSuccessAction,
} from "./types";

// Action creators

function setImportInProgress(): SetImportInProgressAction {
	return {
		type: IMPORT_IN_PROGRESS,
	};
}

function setImportError(importErrorMsg: string): SetImportErrorAction {
	return {
		type: IMPORT_ERROR,
		payload: {
			importErrorMsg,
		},
	};
}

function setImportSuccess(): SetImportSuccessAction {
	return {
		type: IMPORT_SUCCESS,
	};
}

export function setImportFormat(importFormat: ImportFormat): SetImportFormatAction {
	return {
		type: SET_IMPORT_FORMAT,
		payload: {
			importFormat,
		},
	};
}

// Thunks

export const runImport =
	(fileContent: string): ThunkActionT =>
	async (dispatch, getState): Promise<void> => {
		const { importFormat } = getState().import;

		dispatch(setImportInProgress());
		try {
			// Get parser function for import format
			let parseFunc;
			if (importFormat === "jsonDayOne") {
				parseFunc = parseDayOneJson;
			} else if (importFormat === "jsonJrnl") {
				parseFunc = parseJrnlJson;
			} else if (importFormat === "jsonMiniDiary") {
				parseFunc = parseMiniDiaryJson;
			} else if (importFormat === "mdMiniDiary") {
				parseFunc = parseMiniDiaryMd;
			} else if (importFormat === "mdSingle") {
				parseFunc = (content: string) =>
					parseSingleEntryMd(content, toIndexDate(getState().diary.dateSelected));
			} else if (importFormat === "txtDayOne") {
				parseFunc = parseDayOneTxt;
			} else {
				throw Error(`Unrecognized importFormat "${importFormat}"`);
			}

			// Parse file and make it compatible with Dayleaf
			const json = parseFunc(fileContent);
			await dispatch(mergeUpdateFile(json));
			dispatch(setImportSuccess());
			dispatch(closeOverlay());
		} catch (err) {
			console.error("Error importing diary file: ", err);
			dispatch(setImportError(err.toString()));
		}
	};
