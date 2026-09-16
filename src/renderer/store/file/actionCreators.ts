import { flushPersistence, persist, settleDraft } from "../../utils/persistence";
import { Entries, IndexDate } from "../../types";
import { createDate } from "../../utils/dateFormat";
import {
	addIndexDoc,
	cancelIndexUpdate,
	cancelIndexUpdates,
	createIndex,
	flushIndexUpdates,
	removeIndexDoc,
	scheduleIndexUpdate,
} from "../../utils/searchIndex";
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
	SET_ENTRIES,
	SET_FILE_EXISTS,
	SetDecryptErrorAction,
	SetDecryptInProgressAction,
	SetDecryptSuccessAction,
	SetEncryptErrorAction,
	SetEncryptInProgressAction,
	SetEncryptSuccessAction,
	SetEntriesAction,
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

function setEntries(entries: Entries): SetEntriesAction {
	return { type: SET_ENTRIES, payload: { entries } };
}

function setFileExists(fileExists: boolean): SetFileExistsAction {
	return { type: SET_FILE_EXISTS, payload: { fileExists } };
}

export const testFileExists =
	(): ThunkActionT =>
	async (dispatch): Promise<void> => {
		dispatch(setFileExists(await window.miniDiary.diary.fileExists()));
	};

export const lock =
	(): ThunkActionT =>
	async (dispatch): Promise<void> => {
		try {
			await flushPersistence();
			flushIndexUpdates();
			await window.miniDiary.diary.lock();
		} catch (error) {
			await window.miniDiary.dialogs.showError("Save failed", error.message);
			return;
		}
		cancelIndexUpdates();
		dispatch(clearFileState());
		disableMenuItems();
	};

export const decryptFile =
	(password: string): ThunkActionT =>
	async (dispatch): Promise<void> => {
		dispatch(setDecryptInProgress());
		try {
			const { entries } = await window.miniDiary.diary.read(password);
			dispatch(setDecryptSuccess(entries));
			await createIndex(entries);
			enableMenuItems();
		} catch (error) {
			console.error("Error decrypting diary file: ", error);
			dispatch(setDecryptError(error.message));
		}
	};

export const createEncryptedFile =
	(password: string): ThunkActionT =>
	async (dispatch): Promise<void> => {
		dispatch(setEncryptInProgress());
		try {
			const { entries } = await window.miniDiary.diary.create(password);
			dispatch(setEncryptSuccess(entries));
			await createIndex(entries);
			enableMenuItems();
		} catch (error) {
			console.error("Error creating encrypted diary file: ", error);
			dispatch(setEncryptError(error.message));
		}
	};

function saveEntry(entryDate: IndexDate, entry: Entries[IndexDate] | null): ThunkActionT {
	return (): void => {
		persist(entryDate, () => window.miniDiary.diary.save({ entry, indexDate: entryDate }));
	};
}

function replaceEntries(entries: Entries): ThunkActionT {
	return async (dispatch): Promise<void> => {
		dispatch(setEncryptInProgress());
		try {
			await window.miniDiary.diary.replaceEntries(entries);
			dispatch(setEncryptSuccess(entries));
		} catch (error) {
			console.error("Error updating diary file: ", error);
			dispatch(setEncryptError(error.message));
		}
	};
}

export const resetDiary =
	(): ThunkActionT =>
	async (dispatch): Promise<void> => {
		await window.miniDiary.diary.reset();
		dispatch(clearFileState());
		disableMenuItems();
	};

export const updatePassword =
	(newPassword: string): ThunkActionT =>
	async (dispatch, getState): Promise<void> => {
		dispatch(setEncryptInProgress());
		try {
			const { entries } = await window.miniDiary.diary.updatePassword(
				newPassword,
				getState().file.entries,
			);
			dispatch(setEncryptSuccess(entries));
		} catch (error) {
			dispatch(setEncryptError(error.message));
		}
	};

export const updateEntry =
	(entryDate: IndexDate, title: string, text: string): ThunkActionT =>
	(dispatch, getState): void => {
		const { entries, isUnlocked } = getState().file;
		if (!isUnlocked) return;

		const updated = { ...entries };
		if (!title && !text) {
			if (updated[entryDate]) {
				cancelIndexUpdate(entryDate);
				void removeIndexDoc(entryDate);
				delete updated[entryDate];
			}
		} else if (!updated[entryDate]) {
			const entry = {
				dateUpdated: createDate().toString(),
				title,
				text,
				textFormat: "markdown" as const,
				textFormatVersion: 1,
			};
			updated[entryDate] = entry;
			void addIndexDoc(entryDate, entry);
		} else if (title !== updated[entryDate].title || text !== updated[entryDate].text) {
			const oldEntry = updated[entryDate];
			const entry = {
				dateUpdated: createDate().toString(),
				title,
				text,
				textFormat: "markdown" as const,
				textFormatVersion: 1,
			};
			updated[entryDate] = entry;
			scheduleIndexUpdate(entryDate, oldEntry, entry);
		} else {
			settleDraft();
			return;
		}
		dispatch(setEntries(updated));
		dispatch(saveEntry(entryDate, updated[entryDate] || null));
	};

export const mergeUpdateFile =
	(newEntries: Entries): ThunkActionT =>
	async (dispatch, getState): Promise<void> => {
		const entries = { ...getState().file.entries, ...newEntries };
		dispatch(setEntries(entries));
		await createIndex(entries);
		dispatch(replaceEntries(entries));
	};
