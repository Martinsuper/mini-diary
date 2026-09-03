import {
	CLEAR_FILE_STATE,
	DECRYPT_ERROR,
	DECRYPT_IN_PROGRESS,
	DECRYPT_SUCCESS,
	ENCRYPT_ERROR,
	ENCRYPT_IN_PROGRESS,
	ENCRYPT_SUCCESS,
	FileAction,
	FileState,
	SET_ENTRIES,
	SET_FILE_EXISTS,
} from "./types";

const initialState: FileState = {
	decryptErrorMsg: "",
	decryptStatus: "idle",
	encryptErrorMsg: "",
	encryptStatus: "idle",
	entries: {},
	fileExists: false,
	isUnlocked: false,
};

function fileReducer(state = initialState, action: FileAction): FileState {
	switch (action.type) {
		case CLEAR_FILE_STATE: {
			return {
				...state,
				entries: {},
				isUnlocked: false,
			};
		}
		case DECRYPT_IN_PROGRESS: {
			return {
				...state,
				decryptErrorMsg: "",
				decryptStatus: "inProgress",
			};
		}
		case DECRYPT_ERROR: {
			return {
				...state,
				decryptErrorMsg: action.payload.decryptErrorMsg,
				decryptStatus: "error",
			};
		}
		case DECRYPT_SUCCESS: {
			return {
				...state,
				decryptErrorMsg: "",
				decryptStatus: "idle",
				entries: action.payload.entries,
				isUnlocked: true,
			};
		}
		case ENCRYPT_IN_PROGRESS: {
			return {
				...state,
				encryptStatus: "inProgress",
			};
		}
		case ENCRYPT_ERROR: {
			return {
				...state,
				encryptErrorMsg: action.payload.encryptErrorMsg,
				encryptStatus: "error",
			};
		}
		case ENCRYPT_SUCCESS: {
			return {
				...state,
				encryptStatus: "idle",
				entries: action.payload.entries,
				fileExists: true,
				isUnlocked: true,
			};
		}
		case SET_ENTRIES: {
			return {
				...state,
				entries: action.payload.entries,
			};
		}
		case SET_FILE_EXISTS: {
			return {
				...state,
				fileExists: action.payload.fileExists,
			};
		}
		default:
			return state;
	}
}

export default fileReducer;
