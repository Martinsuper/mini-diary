import { applyMiddleware, combineReducers, createStore, Store } from "redux";
import { createLogger } from "redux-logger";
import { ThunkAction, ThunkDispatch, thunk } from "redux-thunk";

import appReducer from "./app/reducer";
import { AppAction } from "./app/types";
import diaryReducer from "./diary/reducer";
import { DiaryAction } from "./diary/types";
import exportReducer from "./export/reducer";
import { ExportAction } from "./export/types";
import fileReducer from "./file/reducer";
import { FileAction } from "./file/types";
import importReducer from "./import/reducer";
import { ImportAction } from "./import/types";

const rootReducer = combineReducers({
	app: appReducer,
	diary: diaryReducer,
	file: fileReducer,
	export: exportReducer,
	import: importReducer,
});

export type RootAction = AppAction | DiaryAction | ExportAction | FileAction | ImportAction;
export type RootState = ReturnType<typeof rootReducer>;
export type ThunkActionT = ThunkAction<void, RootState, undefined, RootAction>;
export type ThunkDispatchT = ThunkDispatch<RootState, undefined, RootAction>;

const middleware = process.env.NODE_ENV !== "production" ? [thunk, createLogger()] : [thunk];
const store = createStore(
	rootReducer as any,
	applyMiddleware(...(middleware as any)) as any,
) as Store<RootState, RootAction> & { dispatch: ThunkDispatchT };

export default store;
