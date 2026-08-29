import logger from "electron-log";

import { convertToMiniDiaryJson } from "../../files/export/json";
import { convertToMd } from "../../files/export/md";
import { convertToDayOneTxt } from "../../files/export/txt";
import { ExportFormat, Entries } from "../../types";
import { translations } from "../../utils/i18n";
import { ThunkActionT } from "../store";
import {
	EXPORT_ERROR,
	EXPORT_IN_PROGRESS,
	EXPORT_SUCCESS,
	SetExportErrorAction,
	SetExportInProgressAction,
	SetExportSuccessAction,
} from "./types";

const fileExtensions: Record<ExportFormat, string> = {
	jsonMiniDiary: "json",
	md: "md",
	pdf: "pdf",
	txtDayOne: "txt",
};

// Action creators

function setExportInProgress(): SetExportInProgressAction {
	return {
		type: EXPORT_IN_PROGRESS,
	};
}

function setExportError(exportErrorMsg: string): SetExportErrorAction {
	return {
		type: EXPORT_ERROR,
		payload: {
			exportErrorMsg,
		},
	};
}

function setExportSuccess(): SetExportSuccessAction {
	return {
		type: EXPORT_SUCCESS,
	};
}

// Thunks

const exportToFile = (
	converterFunc: (entries: Entries) => Promise<string>,
	exportFormat: Exclude<ExportFormat, "pdf">,
): ThunkActionT => async (dispatch, getState): Promise<void> => {
	const filePath = await window.miniDiary.dialogs.selectExportPath(
		`mini-diary-export.${fileExtensions[exportFormat]}`,
		translations.export,
	);
	if (!filePath) {
		return;
	}
	dispatch(setExportInProgress());
	try {
		const content = await converterFunc(getState().file.entries);
		await window.miniDiary.diary.writeExport(filePath, content);
		dispatch(setExportSuccess());
	} catch (error) {
		logger.error("Error exporting diary file: ", error);
		dispatch(setExportError(error.toString()));
	}
};

export const exportToJsonMiniDiary = (): ThunkActionT => (dispatch): void => {
	dispatch(exportToFile(convertToMiniDiaryJson, "jsonMiniDiary"));
};

export const exportToMd = (): ThunkActionT => (dispatch): void => {
	dispatch(exportToFile(convertToMd, "md"));
};

export const exportToPdf = (): ThunkActionT => async (dispatch, getState): Promise<void> => {
	const filePath = await window.miniDiary.dialogs.selectExportPath(
		`mini-diary-export.${fileExtensions.pdf}`,
		translations.export,
	);
	if (!filePath) {
		return;
	}
	dispatch(setExportInProgress());
	try {
		const markdown = await convertToMd(getState().file.entries);
		await window.miniDiary.diary.writePdfExport(filePath, markdown);
		dispatch(setExportSuccess());
	} catch (error) {
		logger.error("Error exporting diary file: ", error);
		dispatch(setExportError(error.toString()));
	}
};

export const exportToTxtDayOne = (): ThunkActionT => (dispatch): void => {
	dispatch(exportToFile(convertToDayOneTxt, "txtDayOne"));
};
