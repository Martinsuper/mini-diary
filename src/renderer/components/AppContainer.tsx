import { connect } from "react-redux";

import { openOverlay, updateThemePref } from "../store/app/actionCreators";
import { testFileExists } from "../store/file/actionCreators";
import { RootState, ThunkDispatchT } from "../store/store";
import { ThemePref } from "../types";
import App, { DispatchProps, StateProps } from "./App";

const mapStateToProps = (state: RootState): StateProps => ({
	exportErrorMsg: state.export.exportErrorMsg,
	exportStatus: state.export.exportStatus,
	fileExists: state.file.fileExists,
	isUnlocked: state.file.isUnlocked,
	importErrorMsg: state.import.importErrorMsg,
	importStatus: state.import.importStatus,
	overlay: state.app.overlay,
	theme: state.app.theme,
	themePref: state.app.themePref,
});

const mapDispatchToProps = (dispatch: ThunkDispatchT): DispatchProps => ({
	openPreferences: (): void => {
		dispatch(openOverlay("preferences"));
	},
	testFileExists: async (): Promise<void> => {
		await dispatch(testFileExists());
	},
	updateThemePref: (themePref: ThemePref): void => dispatch(updateThemePref(themePref)),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
