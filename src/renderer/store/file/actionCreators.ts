import logger from "electron-log";

import { Entries, IndexDate } from "../../types";
import { createDate } from "../../utils/dateFormat";
import { addIndexDoc, createIndex, removeIndexDoc, updateIndexDoc } from "../../utils/searchIndex";
import { disableMenuItems, enableMenuItems } from "../../electron/ipcRenderer/senders";
import { ThunkActionT } from "../store";
import {
	CLEAR_FILE_STATE,
	ClearFileStateAction,
	DECRYPT_ERROR,
	DECRYPT_IN_PROGRESS,
	DECRYPT_SUCCESS,
	ENCRYPT_ERROR,
	ENCRYPT_IN_PROGRESS,
	ENCRYPT_SUCCESS,
	SET_FILE_EXISTS,
	SetDecryptErrorAction,
	SetDecryptInProgressAction,
	SetDecryptSuccessAction,
	SetEncryptErrorAction,
	SetEncryptInProgressAction,
	SetEncryptSuccessAction,
	SetFileExistsAction,
} from "./types";

function clearFileState(): ClearFileStateAction {
	return { type: CLEAR_FILE_STATE };
}

function setDecryptInProgress(): SetDecryptInProgressAction {
	return { type: DECRYPT_IN_PROGRESS };
}

function setDecryptError(decryptErrorMsg: string): SetDecryptErrorAction {
	return { type: DECRYPT_ERROR, payload: { decryptErrorMsg } };
}

function setDecryptSuccess(entries: Entries): SetDecryptSuccessAction {
	return { type: DECRYPT_SUCCESS, payload: { entries } };
}

function setEncryptInProgress(): SetEncryptInProgressAction {
	return { type: ENCRYPT_IN_PROGRESS };
}

function setEncryptError(encryptErrorMsg: string): SetEncryptErrorAction {
	return { type: ENCRYPT_ERROR, payload: { encryptErrorMsg } };
}

function setEncryptSuccess(entries: Entries): SetEncryptSuccessAction {
	return { type: ENCRYPT_SUCCESS, payload: { entries } };
}

function setFileExists(fileExists: boolean): SetFileExistsAction {
	return { type: SET_FILE_EXISTS, payload: { fileExists } };
}

export const testFileExists = (): ThunkActionT => async (dispatch): Promise<void> => {
	dispatch(setFileExists(await window.miniDiary.diary.fileExists()));
};

export const lock = (): ThunkActionT => (dispatch): void => {
	void window.miniDiary.diary.lock();
	dispatch(clearFileState());
	disableMenuItems();
};

export const decryptFile = (password: string): ThunkActionT => async (dispatch): Promise<void> => {
	dispatch(setDecryptInProgress());
	try {
		const { entries } = await window.miniDiary.diary.read(password);
		dispatch(setDecryptSuccess(entries));
		createIndex(entries);
		enableMenuItems();
	} catch (error) {
		logger.error("Error decrypting diary file: ", error);
		dispatch(setDecryptError(error.message));
	}
};

export const createEncryptedFile = (password: string): ThunkActionT => async (dispatch): Promise<void> => {
	dispatch(setEncryptInProgress());
	try {
		const { entries } = await window.miniDiary.diary.create(password);
		dispatch(setEncryptSuccess(entries));
		enableMenuItems();
	} catch (error) {
		logger.error("Error creating encrypted diary file: ", error);
		dispatch(setEncryptError(error.message));
	}
};

function saveEntries(entries: Entries): ThunkActionT {
	return async (dispatch): Promise<void> => {
		dispatch(setEncryptInProgress());
		try {
			const { entries: savedEntries } = await window.miniDiary.diary.save(entries);
			dispatch(setEncryptSuccess(savedEntries));
		} catch (error) {
			logger.error("Error updating diary file: ", error);
			dispatch(setEncryptError(error.message));
		}
	};
}

export const resetDiary = (): ThunkActionT => async (dispatch): Promise<void> => {
	await window.miniDiary.diary.reset();
	dispatch(lock());
};

export const updatePassword = (newPassword: string): ThunkActionT => async (dispatch, getState): Promise<void> => {
	dispatch(setEncryptInProgress());
	try {
		const { entries } = await window.miniDiary.diary.updatePassword(newPassword, getState().file.entries);
		dispatch(setEncryptSuccess(entries));
	} catch (error) {
		dispatch(setEncryptError(error.message));
	}
};

export const updateEntry = (entryDate: IndexDate, title: string, text: string): ThunkActionT => (
	dispatch,
	getState,
): void => {
	const { entries, hashedPassword } = getState().file;
	if (!hashedPassword) {
		return;
	}
	const updated = { ...entries };
	if (!title && !text) {
		if (updated[entryDate]) {
			removeIndexDoc(entryDate, updated[entryDate]);
			delete updated[entryDate];
		}
	} else if (!updated[entryDate]) {
		const entry = { dateUpdated: createDate().toString(), title, text };
		updated[entryDate] = entry;
		addIndexDoc(entryDate, entry);
	} else if (title !== updated[entryDate].title || text !== updated[entryDate].text) {
		const oldEntry = updated[entryDate];
		const entry = { dateUpdated: createDate().toString(), title, text };
		updated[entryDate] = entry;
		updateIndexDoc(entryDate, oldEntry, entry);
	} else {
		return;
	}
	dispatch(saveEntries(updated));
};

export const mergeUpdateFile = (newEntries: Entries): ThunkActionT => (dispatch, getState): void => {
	const entries = { ...getState().file.entries, ...newEntries };
	createIndex(entries);
	dispatch(saveEntries(entries));
};
